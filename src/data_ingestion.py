"""
Módulo de Ingesta de Datos - Boston Housing Dataset

Este módulo descarga el dataset 'Boston Housing' desde Kaggle y genera un
reporte exploratorio de datos (EDA) usando ydata-profiling.

Flujo:
1. Configura credenciales de Kaggle desde variables de entorno
2. Autentica y descarga el dataset desde Kaggle
3. Carga los datos en un DataFrame
4. Genera reporte EDA en formatos HTML y JSON
5. Extrae y muestra alertas encontradas en el análisis
"""

import os
import sys
import logging
import json
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime
import pandas as pd
from dotenv import load_dotenv

# ============================================================================
# CONFIGURACIÓN DE LOGGING
# ============================================================================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURACIÓN DE RUTAS DEL PROYECTO
# ============================================================================
try:
    # __file__ no está disponible en algunos entornos interactivos
    PROJECT_ROOT = Path(__file__).resolve().parent.parent
except NameError:
    # Alternativa: usar el directorio de trabajo actual
    PROJECT_ROOT = Path.cwd()

DATA_DIR = PROJECT_ROOT / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
REPORTS_DIR = DATA_DIR / "reports"
ENV_FILE = PROJECT_ROOT / ".env"

# ============================================================================
# CREACIÓN DE DIRECTORIOS
# ============================================================================
# Crear directorios si no existen
DATA_DIR.mkdir(exist_ok=True)
RAW_DATA_DIR.mkdir(exist_ok=True)
REPORTS_DIR.mkdir(exist_ok=True)

# ============================================================================
# CARGA DE VARIABLES DE ENTORNO
# ============================================================================
# Cargar credenciales y configuración desde archivo .env
if ENV_FILE.exists():
    load_dotenv(ENV_FILE)
    logger.info("✅ Archivo .env encontrado y cargado.")
else:
    logger.warning("⚠️ Archivo .env no encontrado. Las credenciales deben estar pre-configuradas como variables de entorno.")


# ============================================================================
# FUNCIONES DE CONFIGURACIÓN Y AUTENTICACIÓN
# ============================================================================

def configurar_credenciales() -> bool:
    """
    Configura las credenciales de la API de Kaggle desde variables de entorno.

    Busca las variables de entorno KAGGLE_USERNAME y KAGGLE_KEY (cargadas desde .env).
    Si no las encuentra, registra una advertencia pero permite continuar
    (las credenciales pueden estar pre-configuradas en el sistema).

    Returns:
        bool: True si las credenciales están disponibles, False en caso contrario.
        
    Notas:
        - Las credenciales deben estar en el archivo .env o como variables de entorno del sistema
        - Los valores por defecto en este código son solo para desarrollo local
    """
    # Obtener credenciales desde variables de entorno
    username = os.getenv('KAGGLE_USERNAME', "marestrepohi")
    api_key = os.getenv('KAGGLE_KEY', "037c85291a66a2b8159a83970e814353")

    if not username or not api_key:
        logger.warning("⚠️ Credenciales no encontradas en las variables de entorno.")
        logger.warning("   Asegúrate de tener un archivo .env con KAGGLE_USERNAME y KAGGLE_KEY.")
        return False

    # Asignar credenciales a variables de entorno que la librería kaggle espera
    os.environ['KAGGLE_USERNAME'] = username
    os.environ['KAGGLE_KEY'] = api_key

    logger.info(f"✅ Credenciales configuradas para el usuario: {username}")
    return True


def descargar_y_cargar_datos() -> pd.DataFrame | None:
    """
    Descarga el dataset 'Boston Housing' desde Kaggle y lo carga en un DataFrame.

    Proceso:
    1. Importa la librería kaggle (importación local para evitar dependencia obligatoria)
    2. Configura las credenciales de autenticación
    3. Autentica con la API de Kaggle
    4. Descarga y descomprime el dataset
    5. Busca el primer archivo CSV y lo carga

    Returns:
        pd.DataFrame | None: DataFrame con los datos si la operación es exitosa,
                             None si ocurre un error.
                             
    Excepciones:
        - Registra errores si no encuentra credenciales
        - Registra errores si falla la autenticación
        - Registra errores si falla la descarga
        - Registra errores si no encuentra archivos CSV
    """
    logger.info("📥 Iniciando descarga y carga de datos desde Kaggle...")

    try:
        # Importación local: permite que el resto del script funcione si kaggle no está instalado
        from kaggle.api.kaggle_api_extended import KaggleApi

        # Paso 1: Configurar credenciales
        if not configurar_credenciales():
            logger.error("❌ No se puede continuar sin las credenciales de Kaggle.")
            return None

        # Paso 2: Autenticar con la API
        logger.info("🔐 Autenticando con la API de Kaggle...")
        api = KaggleApi()
        api.authenticate()
        logger.info("✅ Autenticación exitosa.")

        # Paso 3: Descargar dataset
        dataset_slug = 'altavish/boston-housing-dataset'
        logger.info(f"🌐 Descargando dataset: {dataset_slug}")
        api.dataset_download_files(
            dataset_slug,
            path=str(RAW_DATA_DIR),
            unzip=True
        )
        logger.info(f"✅ Dataset descargado y descomprimido en: {RAW_DATA_DIR}")

        # Paso 4: Buscar y cargar el primer archivo CSV
        csv_files = list(RAW_DATA_DIR.glob('*.csv'))
        if not csv_files:
            logger.error("❌ No se encontraron archivos CSV en el directorio de descarga.")
            return None
            
        csv_file = csv_files[0]
        logger.info(f"📂 Cargando archivo de datos: {csv_file.name}")
        df = pd.read_csv(csv_file)
        
        logger.info(f"✅ Dataset cargado exitosamente:")
        logger.info(f"   - Filas: {df.shape[0]}")
        logger.info(f"   - Columnas: {df.shape[1]}")
        logger.info(f"   - Nombres de columnas: {', '.join(df.columns.tolist())}")

        return df

    except Exception as e:
        logger.exception(f"❌ Error durante la descarga del dataset: {e}")
        return None


def generar_reporte_eda(df: pd.DataFrame):
    """
    Genera un reporte de Análisis Exploratorio de Datos (EDA) usando ydata-profiling.

    Proceso:
    1. Crea un perfil del DataFrame con ydata-profiling
    2. Genera reporte HTML interactivo
    3. Genera archivo JSON con datos del reporte
    4. Limpia valores NaN para validez JSON
    5. Guarda versiones con timestamp y sin timestamp para compatibilidad

    Los archivos se nombran con timestamp en formato: archivo_AAAA-MM-DD.{html|json}

    Args:
        df (pd.DataFrame): DataFrame a analizar
        
    Notas:
        - Se mantienen dos copias: con timestamp (histórico) y sin timestamp (producción)
        - El JSON se sanitiza para reemplazar NaN con null (JSON válido)
    """
    logger.info("📊 Generando Análisis Exploratorio de Datos (EDA)...")

    try:
        # Importación local: no es obligatorio si ydata-profiling no está disponible
        from ydata_profiling import ProfileReport

        # Crear perfil del dataset
        logger.info("   - Analizando estructura de datos...")
        profile = ProfileReport(
            df,
            title="Reporte de Análisis Exploratorio - Boston Housing Dataset",
            explorative=True,
        )

        # Obtener fecha actual en formato AAAA-MM-DD para naming
        fecha_actual = datetime.now().strftime("%Y-%m-%d")

        # ====================================================================
        # GUARDAR REPORTE EN FORMATO HTML (con timestamp)
        # ====================================================================
        html_path = REPORTS_DIR / f"raw_eda_report_{fecha_actual}.html"
        logger.info(f"   - Generando reporte HTML...")
        profile.to_file(html_path)
        logger.info(f"✅ Reporte HTML guardado: {html_path}")

        # ====================================================================
        # GUARDAR DATOS DEL REPORTE EN FORMATO JSON (con timestamp)
        # ====================================================================
        json_path = REPORTS_DIR / f"eda_data_{fecha_actual}.json"
        logger.info(f"   - Extrayendo datos del reporte a JSON...")
        json_data = profile.to_json()
        
        # Sanitizar JSON: reemplazar NaN con null (JSON estándar no soporta NaN)
        # ydata-profiling genera valores NaN que no son válidos en JSON
        json_data = json_data.replace(': NaN,', ': null,').replace(': NaN}', ': null}')
        
        with open(json_path, "w", encoding="utf-8") as f:
            f.write(json_data)
        logger.info(f"✅ Datos del reporte JSON guardados: {json_path}")

        # ====================================================================
        # GUARDAR COPIA SIN TIMESTAMP (para compatibilidad con API/Frontend)
        # ====================================================================
        json_path_latest = REPORTS_DIR / "eda_data.json"
        with open(json_path_latest, "w", encoding="utf-8") as f:
            f.write(json_data)
        logger.info(f"✅ Copia del reporte (sin timestamp) guardada: {json_path_latest}")

        # ====================================================================
        # EXTRAER Y MOSTRAR ALERTAS DEL REPORTE
        # ====================================================================
        mostrar_alertas_reporte(json_path)

    except Exception as e:
        logger.error(f"⚠️ No se pudo generar el reporte EDA: {e}", exc_info=True)


def mostrar_alertas_reporte(json_path: Path):
    """
    Lee el archivo JSON del reporte EDA y muestra las alertas encontradas.

    Proceso:
    1. Abre el archivo JSON generado por ydata-profiling
    2. Extrae la lista de alertas
    3. Muestra cada alerta con formato numerado
    4. Maneja errores de lectura o JSON inválido

    Args:
        json_path (Path): Ruta al archivo JSON del reporte EDA
        
    Excepciones:
        - FileNotFoundError: Si el archivo no existe
        - json.JSONDecodeError: Si el JSON es inválido
        - Exception: Errores generales al procesar alertas
    """
    
    try:
        # Leer archivo JSON
        with open(json_path, 'r', encoding='utf-8') as f:
            eda_data = json.load(f)
        
        # Extraer lista de alertas del JSON
        alertas = eda_data.get('alerts', [])
        
        # Mostrar encabezado con cantidad de alertas
        logger.info("")
        logger.info("=" * 70)
        logger.info(f"🚨 ALERTAS DEL ANÁLISIS EXPLORATORIO: {len(alertas)} encontradas")
        logger.info("=" * 70)
        
        # Mostrar cada alerta numerada
        if alertas:
            for i, alerta in enumerate(alertas, 1):
                alerta_str = str(alerta)
                logger.info(f"   {i:2d}. {alerta_str}")
        else:
            logger.info("   ✅ No se encontraron alertas en el análisis.")
        
        logger.info("=" * 70)
        logger.info("")

    except FileNotFoundError:
        logger.error(f"❌ No se encontró el archivo JSON: {json_path}")
    except json.JSONDecodeError:
        logger.error(f"❌ El archivo JSON está corrompido o mal formado: {json_path}")
    except Exception as e:
        logger.error(f"❌ Error al procesar las alertas: {e}", exc_info=True)



def main():
    """
    Función principal que orquesta el pipeline de ingesta de datos.

    Flujo:
    1. Descarga el dataset desde Kaggle
    2. Carga los datos en un DataFrame
    3. Genera reporte de análisis exploratorio (EDA)
    4. Registra el resultado final

    Returns:
        None
    """
    logger.info("")
    logger.info("=" * 70)
    logger.info("🚀 INICIANDO PIPELINE DE INGESTA DE DATOS")
    logger.info("=" * 70)
    logger.info("")

    # Paso 1: Descargar y cargar datos
    logger.info("[PASO 1/2] Descargando datos desde Kaggle...")
    df = descargar_y_cargar_datos()
    
    if df is None:
        logger.error("❌ No se pudo cargar el dataset. El pipeline se abortó.")
        sys.exit(1)

    # Paso 2: Generar reporte de análisis exploratorio
    logger.info("[PASO 2/2] Generando reporte de análisis exploratorio...")
    generar_reporte_eda(df)

    logger.info("")
    logger.info("=" * 70)
    logger.info("✅ ¡Pipeline de ingesta de datos completado exitosamente!")
    logger.info("=" * 70)
    logger.info("")



if __name__ == "__main__":
    """Punto de entrada del módulo."""
    main()
