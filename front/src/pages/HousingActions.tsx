/**
 * Housing GitHub Actions Page
 * Displays GitHub Actions workflows and their status
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  GitBranch,
  Play,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
  Calendar,
  GitCommit,
  Workflow
} from 'lucide-react';

interface WorkflowRun {
  name: string;
  id: string;
  status: 'success' | 'running' | 'failed' | 'queued';
  branch: string;
  event: string;
  triggeredBy: string;
  triggeredAt: string;
  duration?: string;
  jobs: Job[];
}

interface Job {
  name: string;
  status: 'success' | 'running' | 'failed' | 'pending';
  steps: Step[];
}

interface Step {
  name: string;
  status: 'success' | 'running' | 'failed' | 'pending';
}

export default function HousingActions() {
  const [workflows, setWorkflows] = useState<WorkflowRun[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock data - simula workflows reales
  useEffect(() => {
    const mockWorkflows: WorkflowRun[] = [
      {
        name: 'MLOps Pipeline - Train & Deploy',
        id: 'ml-pipeline-001',
        status: 'success',
        branch: 'main',
        event: 'push',
        triggeredBy: 'Mateo Restrepo',
        triggeredAt: '2025-10-15T10:30:00',
        duration: '12m 34s',
        jobs: [
          {
            name: 'Setup & Validation',
            status: 'success',
            steps: [
              { name: 'Checkout code', status: 'success' },
              { name: 'Check file changes', status: 'success' }
            ]
          },
          {
            name: 'Tests & Linting',
            status: 'success',
            steps: [
              { name: 'Set up Python', status: 'success' },
              { name: 'Install dependencies', status: 'success' },
              { name: 'Run tests', status: 'success' },
              { name: 'Lint code', status: 'success' }
            ]
          },
          {
            name: 'Train Model',
            status: 'success',
            steps: [
              { name: 'Configure DVC', status: 'success' },
              { name: 'Run DVC pipeline', status: 'success' },
              { name: 'Validate model metrics', status: 'success' }
            ]
          },
          {
            name: 'Build & Deploy',
            status: 'success',
            steps: [
              { name: 'Build Docker image', status: 'success' },
              { name: 'Push to registry', status: 'success' },
              { name: 'Deploy to production', status: 'success' }
            ]
          }
        ]
      },
      {
        name: 'Scheduled Model Retraining',
        id: 'scheduled-retrain-001',
        status: 'success',
        branch: 'main',
        event: 'schedule',
        triggeredBy: 'GitHub Actions',
        triggeredAt: '2025-10-13T02:00:00',
        duration: '8m 12s',
        jobs: [
          {
            name: 'Retrain Model',
            status: 'success',
            steps: [
              { name: 'Checkout code', status: 'success' },
              { name: 'Set up Python', status: 'success' },
              { name: 'Install dependencies', status: 'success' },
              { name: 'Configure Kaggle credentials', status: 'success' },
              { name: 'Run full DVC pipeline', status: 'success' },
              { name: 'Check model performance', status: 'success' },
              { name: 'Commit model updates', status: 'success' }
            ]
          }
        ]
      },
      {
        name: 'API Tests',
        id: 'api-tests-001',
        status: 'running',
        branch: 'develop',
        event: 'pull_request',
        triggeredBy: 'Mateo Restrepo',
        triggeredAt: '2025-10-15T14:22:00',
        jobs: [
          {
            name: 'Test API Endpoints',
            status: 'running',
            steps: [
              { name: 'Checkout code', status: 'success' },
              { name: 'Set up Python', status: 'success' },
              { name: 'Install dependencies', status: 'running' },
              { name: 'Run API tests', status: 'pending' }
            ]
          }
        ]
      }
    ];

    setWorkflows(mockWorkflows);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'running':
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'queued':
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      success: 'bg-green-100 text-green-700 border-green-300',
      running: 'bg-blue-100 text-blue-700 border-blue-300',
      failed: 'bg-red-100 text-red-700 border-red-300',
      queued: 'bg-gray-100 text-gray-700 border-gray-300',
      pending: 'bg-gray-100 text-gray-700 border-gray-300'
    };
    return config[status as keyof typeof config] || config.queued;
  };

  const getEventBadge = (event: string) => {
    const config = {
      push: { icon: <GitCommit className="h-3 w-3" />, label: 'Push', color: 'bg-blue-50 text-blue-700 border-blue-200' },
      pull_request: { icon: <GitBranch className="h-3 w-3" />, label: 'Pull Request', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      schedule: { icon: <Calendar className="h-3 w-3" />, label: 'Schedule', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      workflow_dispatch: { icon: <Play className="h-3 w-3" />, label: 'Manual', color: 'bg-green-50 text-green-700 border-green-200' }
    };
    return config[event as keyof typeof config] || config.push;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} minuto${minutes !== 1 ? 's' : ''} ago`;
    }
    if (hours < 24) {
      return `${hours} hora${hours !== 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} día${days !== 1 ? 's' : ''} ago`;
  };

  const selectedWorkflowData = workflows.find(w => w.id === selectedWorkflow);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">GitHub Actions</h1>
          <p className="text-muted-foreground">
            Workflows automáticos para training, testing y deployment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <a
            href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/actions"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="sm" className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Ver en GitHub
            </Button>
          </a>
        </div>
      </div>

      {/* Workflows Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Workflow className="h-4 w-4 text-blue-600" />
                  MLOps Pipeline
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  ml-pipeline.yml
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">
                Pipeline completo de MLOps: training, testing y deployment
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Triggers:</span>
                  <span className="font-medium">push, pull_request, manual</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs:</span>
                  <span className="font-medium">4 (Setup, Test, Train, Deploy)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última ejecución:</span>
                  <span className="font-medium text-green-600">Exitosa</span>
                </div>
              </div>
            </div>
            <a
              href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/.github/workflows/ml-pipeline.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-3 w-3 mr-2" />
                Ver configuración
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  Scheduled Retraining
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  scheduled-retrain.yml
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Activo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="text-muted-foreground mb-2">
                Reentrenamiento automático semanal del modelo
              </p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Schedule:</span>
                  <span className="font-medium">Domingos 2:00 AM UTC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jobs:</span>
                  <span className="font-medium">1 (Retrain Model)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última ejecución:</span>
                  <span className="font-medium text-green-600">Hace 2 días</span>
                </div>
              </div>
            </div>
            <a
              href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/blob/main/.github/workflows/scheduled-retrain.yml"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-3 w-3 mr-2" />
                Ver configuración
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Ejecuciones Recientes</CardTitle>
          <CardDescription>
            Historial de workflows ejecutados
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {workflows.map((workflow) => {
            const eventConfig = getEventBadge(workflow.event);
            const isSelected = selectedWorkflow === workflow.id;

            return (
              <div key={workflow.id}>
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary/50 ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedWorkflow(isSelected ? null : workflow.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      {getStatusIcon(workflow.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{workflow.name}</h4>
                          <Badge variant="outline" className={getStatusBadge(workflow.status)}>
                            {workflow.status === 'success' ? 'Exitoso' : 
                             workflow.status === 'running' ? 'Ejecutando' :
                             workflow.status === 'failed' ? 'Fallido' : 'En cola'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {workflow.branch}
                          </span>
                          <Badge variant="outline" className={`${eventConfig.color} text-xs`}>
                            {eventConfig.icon}
                            <span className="ml-1">{eventConfig.label}</span>
                          </Badge>
                          <span>{formatDate(workflow.triggeredAt)}</span>
                          {workflow.duration && <span>⏱️ {workflow.duration}</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Jobs View */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      {workflow.jobs.map((job, jobIdx) => (
                        <div key={jobIdx} className="pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(job.status)}
                            <span className="font-medium text-sm">{job.name}</span>
                          </div>
                          <div className="pl-7 space-y-1">
                            {job.steps.map((step, stepIdx) => (
                              <div key={stepIdx} className="flex items-center gap-2 text-xs text-muted-foreground">
                                {getStatusIcon(step.status)}
                                <span>{step.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <Workflow className="h-4 w-4" />
        <AlertDescription>
          Los workflows se ejecutan automáticamente en respuesta a eventos de Git o en horarios programados.
          Puedes ver logs detallados y ejecutar manualmente workflows desde{' '}
          <a
            href="https://github.com/marestrepohi/meli-mlops-mateo-restrepo/actions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            GitHub Actions
          </a>
          .
        </AlertDescription>
      </Alert>
    </div>
  );
}
