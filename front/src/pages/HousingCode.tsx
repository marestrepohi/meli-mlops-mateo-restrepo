/**
 * Code Browser Page
 * Displays project source code: development notebooks and production scripts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Code2,
  FileCode,
  Folder,
  ExternalLink,
  Book,
  Loader2
} from 'lucide-react';

export default function HousingCode() {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar contenido del archivo desde GitHub raw
  useEffect(() => {
    if (!selectedFile) {
      setFileContent('');
      return;
    }

    const fetchFileContent = async () => {
      setLoading(true);
      setError(null);
      try {
        const rawUrl = `https://raw.githubusercontent.com/marestrepohi/meli-mlops-mateo-restrepo/main/${selectedFile}`;
        const response = await fetch(rawUrl);
        
        if (!response.ok) {
          throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        }
        
        const content = await response.text();
        setFileContent(content);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar el archivo');
        setFileContent('');
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [selectedFile]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Código del Proyecto</h1>
        <p className="text-muted-foreground">
          Explora el código fuente: notebooks de desarrollo y scripts de producción
        </p>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            Explorador de Código
          </CardTitle>
          <CardDescription>
            Navega por los notebooks de desarrollo y los scripts de producción del proyecto MLOps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="desarrollo" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="desarrollo">Desarrollo</TabsTrigger>
              <TabsTrigger value="produccion">Producción</TabsTrigger>
            </TabsList>

            {/* Tab de Desarrollo */}
            <TabsContent value="desarrollo">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar con notebooks */}
                <div className="lg:col-span-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-sm">Notebooks</h3>
                    </div>
                    <div className="space-y-1">
                      <Button
                        variant={selectedFile === 'notebooks/data_extract_eda.ipynb' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('notebooks/data_extract_eda.ipynb')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        data_extract_eda.ipynb
                      </Button>
                      <Button
                        variant={selectedFile === 'notebooks/data_transformacion.ipynb' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('notebooks/data_transformacion.ipynb')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        data_transformacion.ipynb
                      </Button>
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Folder className="h-6 w-6 text-blue-600 mb-2" />
                    <h4 className="font-semibold text-sm mb-1">Notebooks de Desarrollo</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      Exploración y análisis de datos con Jupyter Notebook
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>• Extracción y EDA</li>
                      <li>• Transformación de datos</li>
                    </ul>
                  </div>

                  {/* GitHub Link */}
                  <div className="pt-4 border-t">
                    <a
                      href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/tree/main/notebooks"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver carpeta notebooks en GitHub
                    </a>
                  </div>
                </div>

                {/* Área de visualización del código */}
                <div className="lg:col-span-2">
                  {selectedFile && selectedFile.startsWith('notebooks/') ? (
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-3 border-b">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm font-semibold">{selectedFile}</span>
                        </div>
                        <a
                          href={`https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/${selectedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir en GitHub
                        </a>
                      </div>
                      
                      {loading ? (
                        <div className="bg-muted/30 rounded-lg p-8 max-h-[600px] flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Cargando archivo...</p>
                          </div>
                        </div>
                      ) : error ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="bg-slate-950 rounded-lg p-4 max-h-[600px] overflow-auto">
                          <pre className="text-xs text-slate-100">
                            <code>{fileContent}</code>
                          </pre>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          💡 <strong>Tip:</strong> Haz clic en "Abrir en GitHub" para ver el código con resaltado de sintaxis completo y poder descargarlo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                      <Book className="h-16 w-16 text-blue-600 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Notebooks de Desarrollo</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        Selecciona un notebook para ver su contenido. Estos archivos contienen el análisis exploratorio y la transformación de datos del proyecto.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab de Producción */}
            <TabsContent value="produccion">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar con archivos de producción */}
                <div className="lg:col-span-1 space-y-4">
                  {/* Sección Raíz - DVC */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="h-4 w-4 text-orange-600" />
                      <h3 className="font-semibold text-sm">Configuración</h3>
                    </div>
                    <div className="space-y-1">
                      <Button
                        variant={selectedFile === 'dvc.yaml' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('dvc.yaml')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        dvc.yaml
                      </Button>
                    </div>
                  </div>

                  {/* Sección src/ */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="h-4 w-4 text-green-600" />
                      <h3 className="font-semibold text-sm">src/</h3>
                    </div>
                    <div className="space-y-1">
                      <Button
                        variant={selectedFile === 'src/config.py' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('src/config.py')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        config.py
                      </Button>
                      <Button
                        variant={selectedFile === 'src/data_ingestion.py' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('src/data_ingestion.py')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        data_ingestion.py
                      </Button>
                      <Button
                        variant={selectedFile === 'src/data_preparation.py' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('src/data_preparation.py')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        data_preparation.py
                      </Button>
                      <Button
                        variant={selectedFile === 'src/model_train.py' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('src/model_train.py')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        model_train.py
                      </Button>
                    </div>
                  </div>

                  {/* Sección api/ */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Folder className="h-4 w-4 text-purple-600" />
                      <h3 className="font-semibold text-sm">api/</h3>
                    </div>
                    <div className="space-y-1">
                      <Button
                        variant={selectedFile === 'api/main.py' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('api/main.py')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        main.py
                      </Button>
                      <Button
                        variant={selectedFile === 'api/monitoring.py' ? 'secondary' : 'ghost'}
                        className="w-full justify-start text-xs h-auto py-2"
                        onClick={() => setSelectedFile('api/monitoring.py')}
                      >
                        <FileCode className="h-3 w-3 mr-2" />
                        monitoring.py
                      </Button>
                    </div>
                  </div>

                  {/* Info Cards */}
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg bg-green-50 dark:bg-green-950">
                      <Folder className="h-5 w-5 text-green-600 mb-1" />
                      <h4 className="font-semibold text-xs mb-1">Pipeline (src/)</h4>
                      <p className="text-xs text-muted-foreground">
                        Scripts del pipeline de datos y entrenamiento
                      </p>
                    </div>
                    <div className="p-3 border rounded-lg bg-purple-50 dark:bg-purple-950">
                      <Folder className="h-5 w-5 text-purple-600 mb-1" />
                      <h4 className="font-semibold text-xs mb-1">API (api/)</h4>
                      <p className="text-xs text-muted-foreground">
                        API FastAPI y sistema de monitoreo
                      </p>
                    </div>
                  </div>

                  {/* GitHub Link */}
                  <div className="pt-4 border-t">
                    <a
                      href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Ver repositorio completo en GitHub
                    </a>
                  </div>
                </div>

                {/* Área de visualización del código - Producción */}
                <div className="lg:col-span-2">
                  {selectedFile && (selectedFile.startsWith('src/') || selectedFile.startsWith('api/') || selectedFile === 'dvc.yaml') ? (
                    <div>
                      <div className="flex items-center justify-between mb-3 pb-3 border-b">
                        <div className="flex items-center gap-2">
                          <FileCode className="h-4 w-4 text-primary" />
                          <span className="font-mono text-sm font-semibold">{selectedFile}</span>
                        </div>
                        <a
                          href={`https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/${selectedFile}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Abrir en GitHub
                        </a>
                      </div>
                      
                      {loading ? (
                        <div className="bg-muted/30 rounded-lg p-8 max-h-[600px] flex items-center justify-center">
                          <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Cargando archivo...</p>
                          </div>
                        </div>
                      ) : error ? (
                        <Alert variant="destructive">
                          <AlertDescription>
                            {error}
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="bg-slate-950 rounded-lg p-4 max-h-[600px] overflow-auto">
                          <pre className="text-xs text-slate-100">
                            <code>{fileContent}</code>
                          </pre>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <p className="text-xs text-blue-800 dark:text-blue-200">
                          💡 <strong>Tip:</strong> Haz clic en "Abrir en GitHub" para ver el código con resaltado de sintaxis completo y poder descargarlo.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                      <Code2 className="h-16 w-16 text-green-600 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Scripts de Producción</h3>
                      <p className="text-sm text-muted-foreground max-w-md mb-6">
                        Selecciona un archivo para ver su contenido. Estos scripts conforman el pipeline de datos y la API del proyecto.
                      </p>
                      
                      {/* Cards informativos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                        <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                          <Folder className="h-8 w-8 text-green-600 mb-2 mx-auto" />
                          <h4 className="font-semibold text-sm mb-1">src/</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            Pipeline de datos y entrenamiento
                          </p>
                          <ul className="text-xs text-left space-y-1">
                            <li>• config.py</li>
                            <li>• data_ingestion.py</li>
                            <li>• data_preparation.py</li>
                            <li>• model_train.py</li>
                          </ul>
                        </div>
                        <div className="p-4 border rounded-lg bg-purple-50 dark:bg-purple-950">
                          <Folder className="h-8 w-8 text-purple-600 mb-2 mx-auto" />
                          <h4 className="font-semibold text-sm mb-1">api/</h4>
                          <p className="text-xs text-muted-foreground mb-2">
                            API FastAPI y monitoreo
                          </p>
                          <ul className="text-xs text-left space-y-1">
                            <li>• main.py</li>
                            <li>• monitoring.py</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
