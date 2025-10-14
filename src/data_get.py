import os
import sys
import logging
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv

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
REPORTS_DIR = DATA_DIR / "reports"
ENV_FILE = PROJECT_ROOT / ".env"

# --- Creación de Directorios ---
# Se asegura que los directorios necesarios existan antes de usarlos.
DATA_DIR.mkdir(exist_ok=True)
RAW_DATA_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# --- Carga de Variables de Entorno ---
# Carga las variables desde el archivo .env para no exponer credenciales en el código.
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
    logger.info("Archivo .env encontrado y cargado.")
else:
    logger.warning("Archivo .env no encontrado. Las credenciales deben estar pre-configuradas como variables de entorno.")


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


def descargar_y_cargar_datos() -> pd.DataFrame | None:
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



def main():
    """
    Función principal que orquesta la ejecución del script.
    """

    #Descargar y cargar los datos
    df = descargar_y_cargar_datos()

    #Generar reporte de análisis exploratorio (opcional)
    generar_reporte_eda(df)


    logger.info("✅ ¡Proceso de preparación de datos completado exitosamente!")



if __name__ == "__main__":
    main()
