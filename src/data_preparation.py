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


class PreprocesadorDatos:
    """
    Clase para encapsular todo el proceso de preprocesamiento de datos para el
    modelo de predicción de precios de vivienda.
    """

    def __init__(self, params: Optional[Dict[str, Any]] = None):
        """
        Inicializa el preprocesador con un escalador y atributos vacíos.
        
        Args:
            params: Diccionario con parámetros de configuración (opcional)
        """
        self.escalador = StandardScaler()
        self.nombres_caracteristicas: List[str] | None = None
        self.nombre_objetivo: str | None = None
        self.params = params or {}

    def cargar_datos(self, ruta_datos: Path) -> Optional[pd.DataFrame]:
        """
        Carga los datos desde un archivo CSV.

        Args:
            ruta_datos (Path): La ruta al archivo .csv.

        Returns:
            pd.DataFrame | None: Un DataFrame con los datos cargados o None si ocurre un error.
        """
        try:
            logger.info(f"📂 Cargando datos desde {ruta_datos}...")
            df = pd.read_csv(ruta_datos)
            logger.info(f"✅ Datos cargados con éxito. Dimensiones: {df.shape}")
            logger.info(f"📊 Columnas: {', '.join(df.columns.tolist())}")
            return df
        except FileNotFoundError:
            logger.error(f"❌ Error: El archivo no fue encontrado en la ruta: {ruta_datos}")
            return None
        except pd.errors.ParserError as e:
            logger.error(f"❌ Error al parsear el archivo CSV: {e}")
            return None
        except Exception as e:
            logger.exception(f"❌ Ocurrió un error inesperado al cargar los datos: {e}")
            return None

    def limpiar_datos(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Limpia el DataFrame manejando valores nulos y eliminando duplicados.
        Usa parámetros de preprocessing si están disponibles.

        Args:
            df (pd.DataFrame): El DataFrame a limpiar.

        Returns:
            pd.DataFrame: El DataFrame limpio.
        """
        logger.info("🧹 Limpiando los datos...")

        # Obtener parámetros de preprocessing
        preprocessing_params = self.params.get('preprocessing', {})
        handle_missing = preprocessing_params.get('handle_missing', 'mean')  # Cambiado de 'median' a 'mean'
        remove_duplicates = preprocessing_params.get('remove_duplicates', True)

        # Manejo de valores nulos - SIEMPRE usar media (nunca eliminar)
        nulos = df.isnull().sum()
        if nulos.any():
            logger.warning(f"⚠️ Se encontraron valores nulos:\n{nulos[nulos > 0]}")
            
            # Forzar el uso de media para reemplazar valores nulos
            columnas_numericas = df.select_dtypes(include=np.number).columns
            valores_reemplazados = {}
            
            for col in columnas_numericas:
                if df[col].isnull().any():
                    media = df[col].mean()
                    num_nulos = df[col].isnull().sum()
                    # Uso correcto sin inplace para evitar FutureWarning
                    df[col] = df[col].fillna(media)
                    valores_reemplazados[col] = {
                        'nulos': num_nulos,
                        'media': round(media, 4)
                    }
                    logger.info(f"   📊 {col}: {num_nulos} nulos reemplazados con media = {media:.4f}")
            
            logger.info(f"✅ Total: {sum(v['nulos'] for v in valores_reemplazados.values())} valores nulos reemplazados con la media.")
        else:
            logger.info("✅ No se encontraron valores nulos en los datos.")

        # Eliminación de filas duplicadas
        if remove_duplicates:
            len_original = len(df)
            df = df.drop_duplicates()
            if len(df) < len_original:
                num_duplicados = len_original - len(df)
                logger.info(f"🗑️ Se eliminaron {num_duplicados} filas duplicadas.")
            else:
                logger.info("✅ No se encontraron filas duplicadas.")

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
    ruta_preprocesador = Path(preprocessing_params.get('preprocessor_path', 'models/preprocessor.pkl'))
    
    # Crear directorios si no existen
    directorio_procesados.mkdir(parents=True, exist_ok=True)
    ruta_preprocesador.parent.mkdir(parents=True, exist_ok=True)
    
    logger.info("📁 Rutas configuradas:")
    logger.info(f"   - Datos raw: {ruta_datos_raw}")
    logger.info(f"   - Datos procesados: {directorio_procesados}")
    logger.info(f"   - Preprocesador: {ruta_preprocesador}")
    
    # ========================================================================
    # PASO 3: Instanciar preprocesador con parámetros
    # ========================================================================
    prep = PreprocesadorDatos(params=params)
    
    # ========================================================================
    # PASO 4: Cargar y limpiar datos
    # ========================================================================
    df = prep.cargar_datos(ruta_datos_raw)
    if df is None:
        logger.error("❌ No se pudieron cargar los datos. Abortando...")
        return
    
    df_limpio = prep.limpiar_datos(df)
    logger.info(f"📊 Datos limpios: {df_limpio.shape[0]} filas, {df_limpio.shape[1]} columnas")
    
    # ========================================================================
    # PASO 5: Dividir dataset (usa parámetros de params.yaml automáticamente)
    # ========================================================================
    target_column = data_ingestion_params.get('target_column', 'MEDV')
    X_train, X_test, y_train, y_test = prep.dividir_entrenamiento_prueba(
        df_limpio, 
        target_column=target_column
    )
    
    # ========================================================================
    # PASO 6: Escalar características
    # ========================================================================
    X_train_escalado, X_test_escalado = prep.escalar_caracteristicas(X_train, X_test)
    
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
    # PASO 8: Guardar preprocesador
    # ========================================================================
    prep.guardar_preprocesador(ruta_preprocesador)
    
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
    logger.info("=" * 70)


if __name__ == "__main__":
    main()