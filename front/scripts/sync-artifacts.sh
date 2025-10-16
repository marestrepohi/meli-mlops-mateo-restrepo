#!/bin/bash

###############################################################################
# Script para sincronizar artefactos MLOps al frontend
# Copia data/, mlruns/, y models/ desde la raíz del proyecto al public/
#
# Estructura esperada:
#   proyecto/
#   ├── data/
#   ├── mlruns/
#   ├── models/
#   └── front/
#       ├── public/
#       └── scripts/
#           └── sync-artifacts.sh (este archivo)
#
# Uso: ./scripts/sync-artifacts.sh
#      npm run sync:artifacts:bash
###############################################################################

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Directorios (rutas relativas desde front/scripts/)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONT_DIR="$(dirname "$SCRIPT_DIR")"          # front/
ROOT_DIR="$(dirname "$FRONT_DIR")"            # proyecto/
PUBLIC_DIR="$FRONT_DIR/public"                # front/public/

# Carpetas a sincronizar (relativas a ROOT_DIR)
FOLDERS=("data" "mlruns" "models")

# Función para obtener tamaño de directorio
get_dir_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "0"
    fi
}

# Función para sincronizar una carpeta
sync_folder() {
    local folder=$1
    local source_path="$ROOT_DIR/$folder"
    local dest_path="$PUBLIC_DIR/$folder"
    
    # Rutas relativas para mostrar (más legibles)
    local rel_source=$(realpath --relative-to="$PWD" "$source_path" 2>/dev/null || echo "$source_path")
    local rel_dest=$(realpath --relative-to="$PWD" "$dest_path" 2>/dev/null || echo "$dest_path")
    
    echo -e "\n${CYAN}📂 Sincronizando: ${folder}/ → public/${folder}/${NC}"
    echo -e "   ${BLUE}Origen: $rel_source${NC}"
    echo -e "   ${BLUE}Destino: $rel_dest${NC}"
    
    # Verificar si la carpeta fuente existe
    if [ ! -d "$source_path" ]; then
        echo -e "   ${YELLOW}⚠️  Carpeta fuente no existe${NC}"
        echo -e "   ${YELLOW}ℹ️  Saltando sincronización${NC}"
        return 1
    fi
    
    local source_size=$(get_dir_size "$source_path")
    echo -e "   ${BLUE}📊 Tamaño origen: $source_size${NC}"
    
    # Eliminar carpeta destino si existe
    if [ -d "$dest_path" ]; then
        echo -e "   ${YELLOW}🗑️  Eliminando carpeta existente...${NC}"
        rm -rf "$dest_path"
    fi
    
    # Copiar carpeta
    echo -e "   ${BLUE}📦 Copiando archivos...${NC}"
    if cp -r "$source_path" "$dest_path" 2>/dev/null; then
        local dest_size=$(get_dir_size "$dest_path")
        echo -e "   ${GREEN}✅ Copiado exitosamente: $dest_size${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Error copiando carpeta${NC}"
        return 2
    fi
}

# Main
main() {
    echo -e "\n${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║  🔄 Sincronizador de Artefactos MLOps                    ║${NC}"
    echo -e "${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "📍 Directorio raíz: $ROOT_DIR"
    echo -e "📍 Directorio público: $PUBLIC_DIR\n"
    
    # Verificar que el directorio public existe
    if [ ! -d "$PUBLIC_DIR" ]; then
        echo -e "${RED}❌ El directorio public/ no existe: $PUBLIC_DIR${NC}"
        exit 1
    fi
    
    local success_count=0
    local skip_count=0
    local error_count=0
    
    # Sincronizar cada carpeta
    for folder in "${FOLDERS[@]}"; do
        sync_folder "$folder"
        result=$?
        
        if [ $result -eq 0 ]; then
            ((success_count++))
        elif [ $result -eq 1 ]; then
            ((skip_count++))
        else
            ((error_count++))
        fi
    done
    
    # Resumen
    echo -e "\n${BOLD}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║  📊 Resumen de Sincronización                            ║${NC}"
    echo -e "${BOLD}╚═══════════════════════════════════════════════════════════╝${NC}\n"
    
    echo -e "${GREEN}✅ Exitosas: $success_count${NC}"
    echo -e "${YELLOW}⚠️  Saltadas:  $skip_count${NC}"
    echo -e "${RED}❌ Errores:   $error_count${NC}"
    
    if [ $success_count -gt 0 ]; then
        echo -e "\n${GREEN}🎉 Sincronización completada!${NC}"
        echo -e "${GREEN}🌐 El frontend puede acceder a los artefactos en /public/${NC}\n"
        exit 0
    else
        echo -e "\n${YELLOW}⚠️  No se sincronizaron artefactos${NC}"
        echo -e "${YELLOW}💡 Ejecuta el pipeline DVC primero: make pipeline${NC}\n"
        exit 0  # No fallar si no hay artefactos aún
    fi
}

# Ejecutar
main
