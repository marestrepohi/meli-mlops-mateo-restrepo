#!/usr/bin/env node

/**
 * Script para sincronizar artefactos MLOps al frontend
 * Copia data/, mlruns/, y models/ desde la raíz del proyecto al public/
 * 
 * Estructura esperada:
 *   proyecto/
 *   ├── data/
 *   ├── mlruns/
 *   ├── models/
 *   └── front/
 *       ├── public/
 *       └── scripts/
 *           └── sync-artifacts.js (este archivo)
 * 
 * Uso: npm run sync:artifacts
 *      node scripts/sync-artifacts.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas relativas desde front/scripts/
const FRONT_DIR = path.resolve(__dirname, '..');        // front/
const ROOT_DIR = path.resolve(FRONT_DIR, '..');         // proyecto/
const PUBLIC_DIR = path.join(FRONT_DIR, 'public');      // front/public/

const FOLDERS_TO_SYNC = [
  { source: 'data', dest: 'data' },
  { source: 'mlruns', dest: 'mlruns' },
  { source: 'models', dest: 'models' }
];

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        try {
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        } catch (e) {
          // Skip if file cannot be accessed
        }
      }
    }
  } catch (e) {
    // Directory doesn't exist or cannot be accessed
  }
  
  return totalSize;
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    // Crear directorio destino si no existe
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    // Copiar contenido
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // Copiar archivo
    try {
      fs.copyFileSync(src, dest);
    } catch (error) {
      // Ignorar errores de permisos en algunos archivos
      if (error.code !== 'EACCES') {
        throw error;
      }
    }
  }
}

function deleteRecursiveSync(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function syncFolder(folderConfig) {
  const sourcePath = path.join(ROOT_DIR, folderConfig.source);
  const destPath = path.join(PUBLIC_DIR, folderConfig.dest);
  
  // Rutas relativas para mostrar (más legibles)
  const relativeSource = path.relative(process.cwd(), sourcePath);
  const relativeDest = path.relative(process.cwd(), destPath);

  log(`\n📂 Sincronizando: ${folderConfig.source}/ → public/${folderConfig.dest}/`, colors.cyan);
  log(`   Origen: ${relativeSource}`, colors.blue);
  log(`   Destino: ${relativeDest}`, colors.blue);

  // Verificar si la carpeta fuente existe
  if (!fs.existsSync(sourcePath)) {
    log(`   ⚠️  Carpeta fuente no existe`, colors.yellow);
    log(`   ℹ️  Saltando sincronización`, colors.yellow);
    return false;
  }

  const sourceSize = getDirectorySize(sourcePath);
  log(`   📊 Tamaño origen: ${formatBytes(sourceSize)}`, colors.blue);

  // Eliminar carpeta destino si existe
  if (fs.existsSync(destPath)) {
    log(`   🗑️  Eliminando carpeta existente...`, colors.yellow);
    deleteRecursiveSync(destPath);
  }

  // Copiar carpeta
  log(`   📦 Copiando archivos...`, colors.blue);
  try {
    copyRecursiveSync(sourcePath, destPath);
    const destSize = getDirectorySize(destPath);
    log(`   ✅ Copiado exitosamente: ${formatBytes(destSize)}`, colors.green);
    return true;
  } catch (error) {
    log(`   ❌ Error copiando: ${error.message}`, colors.red);
    return false;
  }
}

function main() {
  log('\n╔═══════════════════════════════════════════════════════════╗', colors.bright);
  log('║  🔄 Sincronizador de Artefactos MLOps                    ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════╝\n', colors.bright);

  log(`📍 Directorio raíz: ${ROOT_DIR}`);
  log(`📍 Directorio público: ${PUBLIC_DIR}\n`);

  // Verificar que el directorio public existe
  if (!fs.existsSync(PUBLIC_DIR)) {
    log(`❌ El directorio public/ no existe: ${PUBLIC_DIR}`, colors.red);
    process.exit(1);
  }

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  // Sincronizar cada carpeta
  for (const folder of FOLDERS_TO_SYNC) {
    const result = syncFolder(folder);
    if (result === true) {
      successCount++;
    } else if (result === false) {
      skipCount++;
    } else {
      errorCount++;
    }
  }

  // Resumen
  log('\n╔═══════════════════════════════════════════════════════════╗', colors.bright);
  log('║  📊 Resumen de Sincronización                            ║', colors.bright);
  log('╚═══════════════════════════════════════════════════════════╝\n', colors.bright);

  log(`✅ Exitosas: ${successCount}`, colors.green);
  log(`⚠️  Saltadas:  ${skipCount}`, colors.yellow);
  log(`❌ Errores:   ${errorCount}`, colors.red);

  if (successCount > 0) {
    log('\n🎉 Sincronización completada!', colors.green);
    log('🌐 El frontend puede acceder a los artefactos en /public/\n', colors.green);
  } else {
    log('\n⚠️  No se sincronizaron artefactos', colors.yellow);
    log('💡 Ejecuta el pipeline DVC primero: make pipeline\n', colors.yellow);
  }
}

// Ejecutar
main();
