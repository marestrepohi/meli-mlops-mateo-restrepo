/**
 * New Project Creation Page
 * Form to create new MLOps projects with configuration
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ArrowLeft,
  FolderKanban,
  Database,
  GitBranch,
  Package,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function NewProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    framework: '',
    repository: '',
    artifacts_path: '',
    tracking_uri: '',
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Simulación de creación de proyecto
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold mb-2">¡Proyecto Creado!</h2>
              <p className="text-muted-foreground mb-4">
                Tu proyecto se ha creado exitosamente
              </p>
              <p className="text-sm text-muted-foreground">
                Redirigiendo al inicio...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Inicio
        </Button>
        <h1 className="text-3xl font-bold mb-2">Crear Nuevo Proyecto</h1>
        <p className="text-muted-foreground">
          Configura un nuevo proyecto MLOps con tracking, artefactos y pipelines
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="h-5 w-5" />
              Información Básica
            </CardTitle>
            <CardDescription>
              Detalles generales del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto *</Label>
                <Input
                  id="name"
                  placeholder="mi-proyecto-ml"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Proyecto *</Label>
                <Select value={formData.type} onValueChange={(value) => handleChange('type', value)} required>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classification">Clasificación</SelectItem>
                    <SelectItem value="regression">Regresión</SelectItem>
                    <SelectItem value="genai">IA Generativa</SelectItem>
                    <SelectItem value="nlp">Procesamiento de Lenguaje Natural</SelectItem>
                    <SelectItem value="cv">Visión Computacional</SelectItem>
                    <SelectItem value="timeseries">Series Temporales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente tu proyecto..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Etiquetas</Label>
              <Input
                id="tags"
                placeholder="produccion, xgboost, mlops (separadas por coma)"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Framework y Herramientas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Framework y Herramientas
            </CardTitle>
            <CardDescription>
              Configura las tecnologías del proyecto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="framework">Framework Principal *</Label>
              <Select value={formData.framework} onValueChange={(value) => handleChange('framework', value)} required>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Seleccionar framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scikit-learn">Scikit-learn</SelectItem>
                  <SelectItem value="xgboost">XGBoost</SelectItem>
                  <SelectItem value="tensorflow">TensorFlow</SelectItem>
                  <SelectItem value="pytorch">PyTorch</SelectItem>
                  <SelectItem value="transformers">Transformers (HuggingFace)</SelectItem>
                  <SelectItem value="langchain">LangChain</SelectItem>
                  <SelectItem value="llamaindex">LlamaIndex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Repositorio y Conexiones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Repositorio y Conexiones
            </CardTitle>
            <CardDescription>
              Configura las conexiones externas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repository">URL del Repositorio</Label>
              <Input
                id="repository"
                placeholder="https://github.com/usuario/proyecto"
                value={formData.repository}
                onChange={(e) => handleChange('repository', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tracking_uri">MLflow Tracking URI</Label>
              <Input
                id="tracking_uri"
                placeholder="http://localhost:5000"
                value={formData.tracking_uri}
                onChange={(e) => handleChange('tracking_uri', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                URI del servidor MLflow para tracking de experimentos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Artefactos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Almacenamiento de Artefactos
            </CardTitle>
            <CardDescription>
              Configura dónde se almacenarán los modelos y artefactos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="artifacts_path">Ruta de Artefactos</Label>
              <Input
                id="artifacts_path"
                placeholder="./mlruns o s3://bucket/artifacts"
                value={formData.artifacts_path}
                onChange={(e) => handleChange('artifacts_path', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ruta local o remota (S3, Azure Blob, GCS) para almacenar modelos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.type || !formData.framework}
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Crear Proyecto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
