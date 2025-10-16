import logging
import sys
import yaml
from pathlib import Path
from typing import Tuple, List, Dict, Any, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# --- Configuración del Logging ---
# Se configura un logger para registrar eventos en la consola de forma estandarizada.
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ============================================================================
# FUNCIONES DE UTILIDAD PARA PARÁMETROS
# ============================================================================

def load_params(params_path: str) -> Dict[str, Any]:
    """
    Carga parámetros desde un archivo YAML.
    
    Args:
        params_path: Ruta al archivo params.yaml
        
    Returns:
        Dict con los parámetros cargados
        
    Raises:
        FileNotFoundError: Si el archivo no existe
        yaml.YAMLError: Si hay errores de sintaxis en el YAML
    """
    try:
        with open(params_path, 'r') as file:
            params = yaml.safe_load(file)
        logger.debug(f'✅ Parámetros cargados desde {params_path}')
        return params
    except FileNotFoundError:
        logger.error(f'❌ Archivo no encontrado: {params_path}')
        raise
    except yaml.YAMLError as e:
        logger.error(f'❌ Error de sintaxis YAML: {e}')
        raise
    except Exception as e:
        logger.error(f'❌ Error inesperado: {e}')
        raise


class DataPreprocessor:
    """Utility class to load, clean, split and persist data artifacts."""

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        self.escalador = StandardScaler()
        self.nombres_caracteristicas: List[str] | None = None
        self.nombre_objetivo: str | None = None
        self.params = params or {}

    # ------------------------------------------------------------------
    # Public API (English naming used by training & inference services)
    # ------------------------------------------------------------------
    def load_data(self, ruta_datos: Path) -> Optional[pd.DataFrame]:
        try:
            logger.info(f"📂 Loading data from {ruta_datos}...")
            df = pd.read_csv(ruta_datos)
            logger.info(f"✅ Data loaded successfully. Shape: {df.shape}")
            logger.info(f"📊 Columns: {', '.join(df.columns.tolist())}")
            return df
        except FileNotFoundError:
            logger.error(f"❌ File not found: {ruta_datos}")
            return None
        except pd.errors.ParserError as e:
            logger.error(f"❌ CSV parsing error: {e}")
            return None
        except Exception as e:
            logger.exception(f"❌ Unexpected error when loading data: {e}")
            return None

    def identify_features(self, df: pd.DataFrame, target_column: str | None = None) -> None:
        target = target_column or self.params.get('data_ingestion', {}).get('target_column', 'MEDV')
        if target not in df.columns:
            raise ValueError(f"Target column '{target}' not found in dataset")
        self.nombre_objetivo = target
        self.nombres_caracteristicas = [col for col in df.columns if col != target]
        logger.info(f"🎯 Target column: {self.nombre_objetivo}")
        logger.info(f"� Feature columns: {', '.join(self.nombres_caracteristicas)}")

    def clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("🧹 Cleaning dataset...")
        preprocessing_params = self.params.get('preprocessing', {})
        remove_duplicates = preprocessing_params.get('remove_duplicates', True)
        
        # Variables categóricas (representadas con números)
        variable_categoricas = ['CHAS', 'RAD']

        nulos = df.isnull().sum()
        if nulos.any():
            logger.warning(f"⚠️ Missing values detected:\n{nulos[nulos > 0]}")
            valores_reemplazados = {}
            
            for col in df.columns:
                if df[col].isnull().any():
                    num_nulos = df[col].isnull().sum()
                    
                    # Estrategia 1: Imputar con la MODA para variables categóricas
                    if col in variable_categoricas:
                        mode_val = df[col].mode()[0]
                        df[col] = df[col].fillna(mode_val)
                        valores_reemplazados[col] = {'nulos': num_nulos, 'moda': mode_val}
                        logger.info(f"   📊 {col}: {num_nulos} nulls filled with mode = {mode_val}")
                    
                    # Estrategia 2: Imputar con la MEDIA para el resto (numéricas)
                    else:
                        media = df[col].mean()
                        df[col] = df[col].fillna(media)
                        valores_reemplazados[col] = {'nulos': num_nulos, 'media': round(media, 4)}
                        logger.info(f"   📊 {col}: {num_nulos} nulls filled with mean = {media:.4f}")
            
            logger.info(f"✅ Total replaced values: {sum(v['nulos'] for v in valores_reemplazados.values())}")
        else:
            logger.info("✅ No missing values detected")

        if remove_duplicates:
            len_original = len(df)
            df = df.drop_duplicates()
            if len(df) < len_original:
                logger.info(f"🗑️ Removed {len_original - len(df)} duplicated rows")
            else:
                logger.info("✅ No duplicated rows found")

        return df


    def dividir_entrenamiento_prueba(
        self, 
        df: pd.DataFrame, 
        test_size: Optional[float] = None, 
        random_state: Optional[int] = None,
        shuffle: Optional[bool] = None,
        target_column: str = 'MEDV'
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        """
        Divide los datos en conjuntos de entrenamiento y prueba.
        Usa parámetros de data_ingestion si están disponibles en params.yaml.

        Args:
            df (pd.DataFrame): El DataFrame con todas las características y el objetivo.
            test_size (float, optional): Proporción del dataset para prueba. 
                                         Si es None, se usa el valor de params.yaml.
            random_state (int, optional): Semilla para reproducibilidad.
                                           Si es None, se usa el valor de params.yaml.
            shuffle (bool, optional): Si se debe mezclar antes de dividir.
                                      Si es None, se usa el valor de params.yaml.
            target_column (str): Nombre de la columna objetivo (default: 'MEDV').

        Returns:
            Tuple: X_train, X_test, y_train, y_test.
        """
        # Obtener parámetros de data_ingestion desde params.yaml
        data_ingestion_params = self.params.get('data_ingestion', {})
        
        # Usar valores de params.yaml si no se proporcionaron explícitamente
        if test_size is None:
            test_size = data_ingestion_params.get('test_size', 0.2)
        if random_state is None:
            random_state = data_ingestion_params.get('random_state', 42)
        if shuffle is None:
            shuffle = data_ingestion_params.get('shuffle', True)
        
        # Validar que la columna objetivo existe
        if target_column not in df.columns:
            logger.error(f"❌ Columna objetivo '{target_column}' no encontrada en el DataFrame")
            raise ValueError(f"Columna '{target_column}' no existe")
        
        # Separar características y objetivo
        X = df.drop(columns=[target_column])
        y = df[target_column]

        logger.info(f"✂️ Dividiendo los datos con parámetros:")
        logger.info(f"   - test_size: {test_size} ({int((1-test_size)*100)}% train, {int(test_size*100)}% test)")
        logger.info(f"   - random_state: {random_state}")
        logger.info(f"   - shuffle: {shuffle}")
        logger.info(f"   - target_column: {target_column}")
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, 
            test_size=test_size, 
            random_state=random_state,
            shuffle=shuffle
        )
        
        logger.info(f"✅ División completada:")
        logger.info(f"   - Entrenamiento: {X_train.shape[0]} muestras, {X_train.shape[1]} características")
        logger.info(f"   - Prueba: {X_test.shape[0]} muestras, {X_test.shape[1]} características")
        
        return X_train, X_test, y_train, y_test

    def escalar_caracteristicas(self, X_train: pd.DataFrame, X_test: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """
        Ajusta el escalador con los datos de entrenamiento y transforma ambos conjuntos.

        Args:
            X_train (pd.DataFrame): Características de entrenamiento.
            X_test (pd.DataFrame): Características de prueba.

        Returns:
            Tuple[np.ndarray, np.ndarray]: Los conjuntos de características escalados.
        """
        logger.info("📏 Escalando las características con StandardScaler...")
        X_train_escalado = self.escalador.fit_transform(X_train)
        X_test_escalado = self.escalador.transform(X_test)
        logger.info("✅ Características escaladas correctamente.")
        return X_train_escalado, X_test_escalado

    def guardar_datos_procesados(
        self, 
        X_train: pd.DataFrame, 
        X_test: pd.DataFrame, 
        y_train: pd.Series, 
        y_test: pd.Series, 
        directorio: Path
    ):
        """
        Guarda los conjuntos de datos procesados en archivos CSV.

        Args:
            X_train: Características de entrenamiento.
            X_test: Características de prueba.
            y_train: Objetivo de entrenamiento.
            y_test: Objetivo de prueba.
            directorio: Directorio donde guardar los archivos.
        """
        try:
            logger.info(f"💾 Guardando datos procesados en {directorio}...")
            
            # Guardar nombres de características para uso futuro
            self.nombres_caracteristicas = X_train.columns.tolist()
            self.nombre_objetivo = y_train.name if hasattr(y_train, 'name') else 'target'
            
            # Guardar X_train
            ruta_X_train = directorio / "X_train.csv"
            X_train.to_csv(ruta_X_train, index=False)
            logger.info(f"   ✅ X_train guardado: {ruta_X_train}")
            
            # Guardar X_test
            ruta_X_test = directorio / "X_test.csv"
            X_test.to_csv(ruta_X_test, index=False)
            logger.info(f"   ✅ X_test guardado: {ruta_X_test}")
            
            # Guardar y_train
            ruta_y_train = directorio / "y_train.csv"
            y_train.to_csv(ruta_y_train, index=False, header=True)
            logger.info(f"   ✅ y_train guardado: {ruta_y_train}")
            
            # Guardar y_test
            ruta_y_test = directorio / "y_test.csv"
            y_test.to_csv(ruta_y_test, index=False, header=True)
            logger.info(f"   ✅ y_test guardado: {ruta_y_test}")
            
            # ✨ NUEVO: Guardar datasets completos (features + target) para entrenamiento
            # Estos archivos son necesarios para model_train.py
            train_completo = X_train.copy()
            train_completo[self.nombre_objetivo] = y_train.values
            ruta_train = directorio / "train.csv"
            train_completo.to_csv(ruta_train, index=False)
            logger.info(f"   ✅ train.csv guardado: {ruta_train}")
            
            test_completo = X_test.copy()
            test_completo[self.nombre_objetivo] = y_test.values
            ruta_test = directorio / "test.csv"
            test_completo.to_csv(ruta_test, index=False)
            logger.info(f"   ✅ test.csv guardado: {ruta_test}")
            
            logger.info("✅ Todos los datos procesados guardados exitosamente.")
        except Exception as e:
            logger.exception(f"❌ No se pudieron guardar los datos procesados: {e}")
            raise

    def guardar_preprocesador(self, ruta: Path):
        """
        Guarda el estado del preprocesador (escalador y nombres de columnas).

        Args:
            ruta (Path): Ruta donde guardar el archivo del preprocesador.
        """
        try:
            logger.info(f"💾 Guardando el estado del preprocesador en {ruta}...")
            estado = {
                "escalador": self.escalador,
                "nombres_caracteristicas": self.nombres_caracteristicas,
                "nombre_objetivo": self.nombre_objetivo,
            }
            joblib.dump(estado, ruta)
            logger.info("✅ Preprocesador guardado exitosamente.")
        except Exception as e:
            logger.exception(f"❌ No se pudo guardar el preprocesador: {e}")

    def cargar_preprocesador(self, ruta: Path):
        """
        Carga un estado de preprocesador previamente guardado.

        Args:
            ruta (Path): Ruta al archivo del preprocesador.
        """
        try:
            logger.info(f"📂 Cargando el estado del preprocesador desde {ruta}...")
            estado = joblib.load(ruta)
            self.escalador = estado["escalador"]
            self.nombres_caracteristicas = estado["nombres_caracteristicas"]
            self.nombre_objetivo = estado["nombre_objetivo"]
            logger.info("✅ Preprocesador cargado exitosamente.")
        except FileNotFoundError:
            logger.error(f"❌ Error: No se encontró el archivo del preprocesador en {ruta}")
        except Exception as e:
            logger.exception(f"❌ No se pudo cargar el preprocesador: {e}")

    def procesar_para_inferencia(self, datos_entrada: Dict[str, Any]) -> np.ndarray:
        """
        Preprocesa un único registro de datos para la inferencia del modelo.

        Args:
            datos_entrada (Dict[str, Any]): Un diccionario con los nombres de las
                                            características y sus valores.

        Returns:
            np.ndarray: Un array de NumPy con los datos escalados, listo para la predicción.
        """
        try:
            # Convierte el diccionario a un DataFrame de una sola fila.
            df = pd.DataFrame([datos_entrada])

            # Asegura que las columnas estén en el mismo orden que durante el entrenamiento.
            df = df[self.nombres_caracteristicas]

            # Escala los datos usando el escalador ya ajustado.
            datos_escalados = self.escalador.transform(df)
            
            return datos_escalados
        except KeyError as e:
            logger.error(f"❌ Error de inferencia: Falta la característica '{e}' en los datos de entrada.")
            raise
        except Exception as e:
            logger.exception(f"❌ Error inesperado durante el preprocesamiento para inferencia: {e}")
            raise

    # ------------------------------------------------------------------
    # Backwards-compatible aliases (legacy Spanish method names)
    # ------------------------------------------------------------------
    def cargar_datos(self, ruta_datos: Path) -> Optional[pd.DataFrame]:
        return self.load_data(ruta_datos)

    def limpiar_datos(self, df: pd.DataFrame) -> pd.DataFrame:
        return self.clean_data(df)

    def guardar_preprocesador(self, ruta: Path):
        self.save_preprocessor(ruta)

    def cargar_preprocesador(self, ruta: Path):
        self.load_preprocessor(ruta)

    def procesar_para_inferencia(self, datos_entrada: Dict[str, Any]) -> np.ndarray:
        return self.preprocess_for_inference(datos_entrada)

    # ------------------------------------------------------------------
    # English method names expected by training/inference modules
    # ------------------------------------------------------------------
    def split_features_target(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        if self.nombre_objetivo is None:
            self.identify_features(df)
        X = df[self.nombres_caracteristicas]
        y = df[self.nombre_objetivo]
        return X, y

    def split_train_test(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: Optional[float] = None,
        random_state: Optional[int] = None,
        shuffle: Optional[bool] = None,
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
        data_ingestion_params = self.params.get('data_ingestion', {})
        if test_size is None:
            test_size = data_ingestion_params.get('test_size', 0.2)
        if random_state is None:
            random_state = data_ingestion_params.get('random_state', 42)
        if shuffle is None:
            shuffle = data_ingestion_params.get('shuffle', True)

        logger.info("✂️ Splitting dataset")
        logger.info(f"   - test_size: {test_size}")
        logger.info(f"   - random_state: {random_state}")
        logger.info(f"   - shuffle: {shuffle}")

        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=test_size,
            random_state=random_state,
            shuffle=shuffle,
        )

        logger.info(f"✅ Split completed: train={X_train.shape}, test={X_test.shape}")
        return X_train, X_test, y_train, y_test

    def scale_features(
        self, X_train: pd.DataFrame, X_test: pd.DataFrame
    ) -> Tuple[np.ndarray, np.ndarray]:
        logger.info("📏 Scaling features with StandardScaler...")
        X_train_scaled = self.escalador.fit_transform(X_train)
        X_test_scaled = self.escalador.transform(X_test)
        logger.info("✅ Features scaled")
        return X_train_scaled, X_test_scaled

    def save_preprocessor(self, ruta: Path) -> None:
        logger.info(f"💾 Saving StandardScaler to {ruta}...")
        estado = {
            "escalador": self.escalador,
            "nombres_caracteristicas": self.nombres_caracteristicas,
            "nombre_objetivo": self.nombre_objetivo,
        }
        joblib.dump(estado, ruta)
        logger.info("✅ StandardScaler saved")

    def load_preprocessor(self, ruta: Path) -> None:
        logger.info(f"📂 Loading StandardScaler from {ruta}...")
        estado = joblib.load(ruta)
        self.escalador = estado["escalador"]
        self.nombres_caracteristicas = estado["nombres_caracteristicas"]
        self.nombre_objetivo = estado["nombre_objetivo"]
        logger.info("✅ StandardScaler loaded")

    def preprocess_for_inference(self, datos_entrada: Dict[str, Any]) -> np.ndarray:
        if not self.nombres_caracteristicas:
            raise ValueError("Feature names are not loaded; load the preprocessor first")
        df = pd.DataFrame([datos_entrada])
        df = df[self.nombres_caracteristicas]
        return self.escalador.transform(df)


# ============================================================================
# FUNCIÓN PRINCIPAL
# ============================================================================

def main():
    """
    Punto de entrada principal para el script de preparación de datos.
    Usa parámetros desde params.yaml para configuración centralizada.
    """
    logger.info("🚀 Iniciando el proceso de preparación de datos...")
    
    # ========================================================================
    # PASO 1: Cargar parámetros desde params.yaml
    # ========================================================================
    params_path = Path("params.yaml")
    
    if not params_path.exists():
        logger.error(f"❌ Archivo de parámetros no encontrado: {params_path}")
        logger.info("💡 Asegúrate de que params.yaml esté en el directorio raíz del proyecto")
        return
    
    try:
        params = load_params(str(params_path))
        logger.info("✅ Parámetros cargados desde params.yaml")
    except Exception as e:
        logger.error(f"❌ Error al cargar parámetros: {e}")
        return
    
    # ========================================================================
    # PASO 2: Configurar rutas desde parámetros
    # ========================================================================
    data_ingestion_params = params.get('data_ingestion', {})
    preprocessing_params = params.get('preprocessing', {})
    
    # Rutas de entrada
    ruta_datos_raw = Path(data_ingestion_params.get('raw_data_path', 'data/raw/HousingData.csv'))
    
    # Rutas de salida
    directorio_procesados = Path(preprocessing_params.get('processed_data_dir', 'data/processed'))
    ruta_scaler = Path(preprocessing_params.get('standard_scaler_path', 'models/standard_scaler.pkl'))
    
    # Crear directorios si no existen
    directorio_procesados.mkdir(parents=True, exist_ok=True)
    ruta_scaler.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info("📁 Rutas configuradas:")
    logger.info(f"   - Datos raw: {ruta_datos_raw}")
    logger.info(f"   - Datos procesados: {directorio_procesados}")
    logger.info(f"   - StandardScaler: {ruta_scaler}")
    
    # ========================================================================
    # PASO 3: Instanciar preprocesador con parámetros
    # ========================================================================
    prep = DataPreprocessor(params=params)
    
    # ========================================================================
    # PASO 4: Cargar y limpiar datos
    # ========================================================================
    df = prep.load_data(ruta_datos_raw)
    if df is None:
        logger.error("❌ No se pudieron cargar los datos. Abortando...")
        return
    
    df_limpio = prep.clean_data(df)
    logger.info(f"📊 Datos limpios: {df_limpio.shape[0]} filas, {df_limpio.shape[1]} columnas")
    
    # ========================================================================
    # PASO 5: Dividir dataset (usa parámetros de params.yaml automáticamente)
    # ========================================================================
    target_column = data_ingestion_params.get('target_column', 'MEDV')
    prep.identify_features(df_limpio, target_column)
    X, y = prep.split_features_target(df_limpio)
    X_train, X_test, y_train, y_test = prep.split_train_test(X, y)
    
    # ========================================================================
    # PASO 6: Escalar características
    # ========================================================================
    X_train_escalado, X_test_escalado = prep.scale_features(X_train, X_test)
    
    # Convertir arreglos escalados de vuelta a DataFrames (mantiene nombres de columnas)
    X_train_escalado = pd.DataFrame(
        X_train_escalado, 
        columns=X_train.columns, 
        index=X_train.index
    )
    X_test_escalado = pd.DataFrame(
        X_test_escalado, 
        columns=X_test.columns, 
        index=X_test.index
    )
    
    # ========================================================================
    # PASO 7: Guardar datos procesados
    # ========================================================================
    prep.guardar_datos_procesados(
        X_train_escalado, 
        X_test_escalado, 
        y_train, 
        y_test, 
        directorio_procesados
    )
    
    # ========================================================================
    # PASO 8: Guardar StandardScaler
    # ========================================================================
    # Guardar en models/standard_scaler.pkl (para referencia/backup)
    prep.save_preprocessor(ruta_scaler)
    
    # También guardar directamente en models/production/latest/ para la API
    production_scaler_path = Path("models/production/latest/scaler.pkl")
    production_scaler_path.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info(f"💾 Guardando StandardScaler para producción en {production_scaler_path}...")
    # Guardar solo el escalador (sin el diccionario) para que la API lo use directamente
    joblib.dump(prep.escalador, production_scaler_path)
    logger.info(f"✅ StandardScaler guardado para API: {production_scaler_path}")
    
    # ========================================================================
    # RESUMEN FINAL
    # ========================================================================
    logger.info("=" * 70)
    logger.info("🎉 ¡Proceso de preparación de datos completado exitosamente!")
    logger.info("=" * 70)
    logger.info("📊 RESUMEN:")
    logger.info(f"   - Train: {X_train_escalado.shape[0]} muestras")
    logger.info(f"   - Test: {X_test_escalado.shape[0]} muestras")
    logger.info(f"   - Características: {X_train_escalado.shape[1]}")
    logger.info(f"   - Objetivo: {target_column}")
    logger.info(f"   - Scaler guardado en: {ruta_scaler}")
    logger.info(f"   - Scaler producción en: {production_scaler_path}")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()