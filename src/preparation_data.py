import os
import sys
import logging
import json
import yaml
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


try:
    # __file__ no está definido en algunos entornos interactivos, por lo que se maneja el error.
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
except NameError:
    # Si __file__ no está definido, usamos el directorio de trabajo actual.
    PROJECT_ROOT = Path.cwd()

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"
REPORTS_DIR = DATA_DIR / "reports"
ENV_FILE = PROJECT_ROOT / ".env"
PARAMS_FILE = PROJECT_ROOT / "params.yaml"

# --- Creación de Directorios ---
# Se asegura que los directorios necesarios existan antes de usarlos.
DATA_DIR.mkdir(exist_ok=True)
RAW_DATA_DIR.mkdir(exist_ok=True)
PROCESSED_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# --- Carga de Variables de Entorno ---
# Carga las variables desde el archivo .env para no exponer credenciales en el código.
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
    logger.info("✅ Archivo .env encontrado y cargado.")
else:
    logger.warning("⚠️  Archivo .env no encontrado. Las credenciales deben estar pre-configuradas como variables de entorno.")


# ============================================================================
# FUNCIONES DE CONFIGURACIÓN Y CARGA DE PARÁMETROS
# ============================================================================

def load_params(params_path: Path = PARAMS_FILE) -> Dict[str, Any]:
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
        logger.info(f"✅ Parámetros cargados desde {params_path}")
        logger.debug(f"Parámetros: {params}")
        return params
    except FileNotFoundError:
        logger.error(f"❌ Archivo no encontrado: {params_path}")
        raise
    except yaml.YAMLError as e:
        logger.error(f"❌ Error de sintaxis YAML: {e}")
        raise
    except Exception as e:
        logger.error(f"❌ Error inesperado al cargar parámetros: {e}")
        raise


def configurar_credenciales() -> bool:
    """
    Configura las credenciales de la API de Kaggle a partir de variables de entorno.

    Busca KAGGLE_USERNAME y KAGGLE_KEY en las variables de entorno (cargadas desde .env).
    Si no las encuentra, registra una advertencia.

    Returns:
        bool: True si las credenciales están disponibles, False en caso contrario.
    """
    username = os.getenv('KAGGLE_USERNAME')
    api_key = os.getenv('KAGGLE_KEY')

    if not username or not api_key:
        logger.warning("⚠️ Credenciales no encontradas en las variables de entorno.")
        logger.warning("Asegúrate de tener un archivo .env con KAGGLE_USERNAME y KAGGLE_KEY.")
        return False

    # Las credenciales se asignan a variables de entorno que la librería espera.
    os.environ['KAGGLE_USERNAME'] = username
    os.environ['KAGGLE_KEY'] = api_key

    logger.info(f"✅ Credenciales configuradas para el usuario: {username}")
    return True


def descargar_y_cargar_datos(dataset_name: str = 'altavish/boston-housing-dataset') -> Optional[pd.DataFrame]:
    """
    Descarga el dataset 'Boston Housing' desde Kaggle y lo carga en un DataFrame.

    Utiliza la API de Kaggle para autenticarse, descargar y descomprimir el dataset.
    Luego, busca el primer archivo CSV en el directorio de descarga y lo carga.

    Returns:
        pd.DataFrame | None: Un DataFrame con los datos si la operación es exitosa,
                              o None si ocurre un error.
    """
    logger.info("📥 Iniciando la descarga y carga de datos")

    try:
        # Importación local para que el resto del script pueda funcionar si kaggle no está instalado.
        from kaggle.api.kaggle_api_extended import KaggleApi

        if not configurar_credenciales():
            logger.error("❌ No se puede continuar sin las credenciales.")
            return None

        logger.info("🔐 Autenticando con la API...")
        api = KaggleApi()
        api.authenticate()
        logger.info("✅ Autenticación exitosa.")

        dataset_slug = 'altavish/boston-housing-dataset'
        logger.info(f"🌐 Descargando dataset: {dataset_slug}")
        api.dataset_download_files(
            dataset_slug,
            path=str(RAW_DATA_DIR),
            unzip=True
        )
        logger.info(f"✅ Dataset descargado y descomprimido en: {RAW_DATA_DIR}")

        # Busca el primer archivo CSV en la carpeta de descarga.
        csv_files = list(RAW_DATA_DIR.glob('*.csv'))
        csv_file = csv_files[0]
        logger.info(f"📂 Cargando archivo de datos: {csv_file.name}")
        df = pd.read_csv(csv_file)
        logger.info(f"✅ Dataset cargado con éxito: {df.shape[0]} filas, {df.shape[1]} columnas.")
        logger.info(f"📊 Columnas disponibles: {', '.join(df.columns.tolist())}")

        return df

    except Exception as e:
        logger.exception(f"❌ Ocurrió un error inesperado durante la carga del dataset: {e}")
        return None


def generar_reporte_eda(df: pd.DataFrame):
    """
    Genera un reporte de Análisis Exploratorio de Datos (EDA) usando ydata-profiling.

    Crea un reporte en formato HTML y un archivo JSON para posible integración con frontend.
    Los archivos se nombran con timestamp: archivo_AAAA-MM-DD.{json|html}

    Args:
        df (pd.DataFrame): El DataFrame a analizar.
    """
    logger.info("📊 Generando EDA...")

    try:
        # Importación local para que el script no falle si no está instalado.
        from ydata_profiling import ProfileReport

        profile = ProfileReport(
            df,
            title="Reporte de Perfilado - Boston Housing Dataset",
            explorative=True,
        )

        # Obtener fecha actual en formato AAAA-MM-DD
        fecha_actual = datetime.now().strftime("%Y-%m-%d")

        # Guardar el reporte en formato HTML con timestamp.
        html_path = REPORTS_DIR / f"raw_eda_report_{fecha_actual}.html"
        profile.to_file(html_path)
        logger.info(f"✅ Reporte HTML guardado en: {html_path}")

        # Guardar los datos del reporte en formato JSON con timestamp.
        json_path = REPORTS_DIR / f"eda_data_{fecha_actual}.json"
        json_data = profile.to_json()
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(json_data)
        logger.info(f"✅ Datos del reporte en JSON guardados en: {json_path}")

        # También mantener copia sin timestamp para compatibilidad con API
        json_path_latest = REPORTS_DIR / "eda_data.json"
        with open(json_path_latest, "w", encoding="utf-8") as f:
            f.write(json_data)

        # Mostrar alertas del reporte
        mostrar_alertas_reporte(json_path)

    except Exception as e:
        logger.error(f"⚠️ No se pudo generar el reporte EDA: {e}", exc_info=True)


def mostrar_alertas_reporte(json_path: Path):
    """
    Lee el archivo JSON generado por ydata-profiling y muestra las alertas encontradas.
    Muestra las alertas directamente como aparecen en el JSON, en español traducido.
    
    Args:
        json_path (Path): Ruta al archivo JSON del reporte EDA
    """
    

    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            eda_data = json.load(f)
        
        # Extraer alertas del JSON (vienen como lista de strings)
        alertas = eda_data.get('alerts', [])
        
        
        # Mostrar estadísticas generales
        logger.info(f"ALERTAS DEL ANÁLISIS EXPLORATORIO DE DATOS: {len(alertas)}")
        
        for i, alerta in enumerate(alertas, 1):
            alerta_str = str(alerta)
            logger.info(f" 🚨 {i:2d}. {alerta_str}")

        
    except FileNotFoundError:
        logger.error(f"❌ No se encontró el archivo JSON: {json_path}")
    except json.JSONDecodeError:
        logger.error(f"❌ Error al leer el archivo JSON: {json_path}")
    except Exception as e:
        logger.error(f"❌ Error al procesar las alertas: {e}", exc_info=True)



def split_and_save_data(
    df: pd.DataFrame,
    test_size: float = 0.2,
    random_state: int = 42,
    shuffle: bool = True
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """
    Divide el dataset en train y test y los guarda.
    
    Args:
        df: DataFrame a dividir
        test_size: Proporción para test
        random_state: Semilla para reproducibilidad
        shuffle: Si mezclar los datos
        
    Returns:
        Tuple con (train_df, test_df)
    """
    logger.info(f"\n📊 Dividiendo datos (test_size={test_size})...")
    
    try:
        # Separar features y target
        if 'MEDV' in df.columns:
            y = df['MEDV']
            X = df.drop('MEDV', axis=1)
            
            # Split
            X_train, X_test, y_train, y_test = train_test_split(
                X, y,
                test_size=test_size,
                random_state=random_state,
                shuffle=shuffle
            )
            
            # Recombinar con target
            train_df = pd.concat([X_train, y_train], axis=1)
            test_df = pd.concat([X_test, y_test], axis=1)
        else:
            # Si no hay target, split directo
            train_df, test_df = train_test_split(
                df,
                test_size=test_size,
                random_state=random_state,
                shuffle=shuffle
            )
        
        logger.info(f"✅ Train: {train_df.shape[0]} filas | Test: {test_df.shape[0]} filas")
        
        # Guardar en processed
        train_path = PROCESSED_DIR / "train.csv"
        test_path = PROCESSED_DIR / "test.csv"
        
        train_df.to_csv(train_path, index=False)
        test_df.to_csv(test_path, index=False)
        
        logger.info(f"✅ Train guardado en: {train_path}")
        logger.info(f"✅ Test guardado en: {test_path}")
        
        return train_df, test_df
        
    except Exception as e:
        logger.error(f"❌ Error al dividir datos: {e}", exc_info=True)
        raise


def save_data_metrics(df: pd.DataFrame, params: Dict[str, Any]) -> None:
    """
    Guarda métricas sobre el dataset para DVC tracking.
    
    Args:
        df: DataFrame con los datos
        params: Parámetros usados
    """
    try:
        metrics = {
            "n_samples": int(df.shape[0]),
            "n_features": int(df.shape[1]),
            "missing_values": int(df.isnull().sum().sum()),
            "duplicates": int(df.duplicated().sum()),
            "test_size": params.get('data_ingestion', {}).get('test_size', 0.2),
            "timestamp": datetime.now().isoformat()
        }
        
        metrics_path = REPORTS_DIR / "data_metrics.json"
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        logger.info(f"✅ Métricas guardadas en: {metrics_path}")
        
    except Exception as e:
        logger.error(f"⚠️  Error al guardar métricas: {e}")


def preparar_datos(df: pd.DataFrame) -> pd.DataFrame:
    """
    Prepara y limpia el DataFrame según las necesidades del proyecto.
    
    Args:
        df (pd.DataFrame): DataFrame original
        
    Returns:
        pd.DataFrame: DataFrame preparado y limpio
    """
    logger.info("\n🔧 Preparando datos...")
    
    df_preparado = df.copy()
    
    logger.info(f"✅ Datos preparados: {df_preparado.shape[0]} filas, {df_preparado.shape[1]} columnas")
    
    return df_preparado


def guardar_datos_procesados(df: pd.DataFrame):
    """
    Guarda el DataFrame procesado y un archivo de información del dataset.

    Args:
        df (pd.DataFrame): El DataFrame limpio y preparado.
    """
    # Guardar el dataset principal en formato CSV.
    train_path = DATA_DIR / "housing.csv"
    df.to_csv(train_path, index=False)
    logger.info(f"💾 Datos procesados guardados en: {train_path}")


def main():
    """
    Función principal que orquesta la ejecución del script.
    Integrada con params.yaml para DVC.
    """
    logger.info("=" * 80)
    logger.info("📦 PREPARACIÓN DE DATOS - Boston Housing Dataset")
    logger.info("=" * 80 + "\n")

    try:
        # 1. Cargar parámetros desde params.yaml
        logger.info("📋 Cargando parámetros...")
        params = load_params()
        
        # Extraer parámetros relevantes
        data_ingestion_params = params.get('data_ingestion', {})
        test_size = data_ingestion_params.get('test_size', 0.2)
        random_state = data_ingestion_params.get('random_state', 42)
        shuffle = data_ingestion_params.get('shuffle', True)
        
        logger.info(f"   test_size: {test_size}")
        logger.info(f"   random_state: {random_state}")
        logger.info(f"   shuffle: {shuffle}")

        # 2. Descargar y cargar los datos
        logger.info("\n" + "-" * 80)
        df = descargar_y_cargar_datos()
        if df is None:
            logger.error("❌ El proceso no puede continuar porque los datos no se cargaron.")
            sys.exit(1)

        # 3. Preparar los datos
        logger.info("\n" + "-" * 80)
        df_preparado = preparar_datos(df)

        # 4. Guardar los datos procesados (completo)
        logger.info("\n" + "-" * 80)
        guardar_datos_procesados(df_preparado)

        # 5. Split train/test y guardar en processed/
        logger.info("\n" + "-" * 80)
        train_df, test_df = split_and_save_data(
            df_preparado,
            test_size=test_size,
            random_state=random_state,
            shuffle=shuffle
        )

        # 6. Guardar métricas para DVC
        save_data_metrics(df_preparado, params)

        # 7. Generar reporte de análisis exploratorio
        logger.info("\n" + "-" * 80)
        generar_reporte_eda(df_preparado)

        logger.info("\n" + "=" * 80)
        logger.info("✅ ¡PROCESO COMPLETADO EXITOSAMENTE!")
        logger.info("=" * 80)
        logger.info("\n📊 Resumen:")
        logger.info(f"   • Dataset completo: {df_preparado.shape[0]} filas x {df_preparado.shape[1]} columnas")
        logger.info(f"   • Train: {train_df.shape[0]} filas")
        logger.info(f"   • Test: {test_df.shape[0]} filas")
        logger.info(f"   • Datos guardados en: {DATA_DIR}")
        logger.info(f"   • Reportes en: {REPORTS_DIR}")
        logger.info("\n")

    except FileNotFoundError as e:
        logger.error(f"❌ Archivo no encontrado: {e}")
        sys.exit(1)
    except yaml.YAMLError as e:
        logger.error(f"❌ Error en params.yaml: {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"❌ Error inesperado: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
