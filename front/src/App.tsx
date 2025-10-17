import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Project from "./pages/Project";
import Models from "./pages/Models";
import Pipelines from "./pages/Pipelines";
import Runs from "./pages/Runs";
import Artifacts from "./pages/Artifacts";
import NotFound from "./pages/NotFound";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";

// Housing Project Pages
import HousingProject from "./pages/HousingProject";
import HousingAPIDemo from "./pages/HousingAPIDemo";
import HousingPipeline from "./pages/HousingPipeline";
import HousingExperiments from "./pages/HousingExperiments";
import HousingMonitoring from "./pages/HousingMonitoring";
import HousingEDA from "./pages/HousingEDA";
import HousingMLflow from "./pages/HousingMLflow";
import HousingCode from "./pages/HousingCode";
import HousingActions from "./pages/HousingActions";
import HousingPipelineVisual from "./pages/HousingPipelineVisual";
import NewProject from "./pages/NewProject";

const queryClient = new QueryClient();

// Layout sin sidebar (para inicio y páginas generales)
const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>
  </div>
);

// Layout con sidebar (para proyectos)
const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main 
          className="flex-1 transition-all duration-300 ease-in-out"
          style={{ marginLeft: isCollapsed ? '80px' : '256px' }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SidebarProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
        {/* Páginas sin sidebar */}
        <Route path="/" element={<SimpleLayout><Index /></SimpleLayout>} />
        <Route path="/new-project" element={<SimpleLayout><NewProject /></SimpleLayout>} />
        <Route path="/projects" element={<SimpleLayout><Project /></SimpleLayout>} />
        <Route path="/models" element={<SimpleLayout><Models /></SimpleLayout>} />
        <Route path="/pipelines" element={<SimpleLayout><Pipelines /></SimpleLayout>} />
        <Route path="/runs" element={<SimpleLayout><Runs /></SimpleLayout>} />
        <Route path="/artifacts" element={<SimpleLayout><Artifacts /></SimpleLayout>} />
        
        {/* Housing Price Prediction Project Routes - CON SIDEBAR */}
        <Route path="/housing" element={<ProjectLayout><HousingProject /></ProjectLayout>} />
        <Route path="/housing/code" element={<ProjectLayout><HousingCode /></ProjectLayout>} />
        <Route path="/housing/api-demo" element={<ProjectLayout><HousingAPIDemo /></ProjectLayout>} />
        <Route path="/housing/pipeline" element={<ProjectLayout><HousingPipelineVisual /></ProjectLayout>} />
        <Route path="/housing/actions" element={<ProjectLayout><HousingActions /></ProjectLayout>} />
        <Route path="/housing/experiments" element={<ProjectLayout><HousingExperiments /></ProjectLayout>} />
        <Route path="/housing/monitoring" element={<ProjectLayout><HousingMonitoring /></ProjectLayout>} />
        <Route path="/housing/eda" element={<ProjectLayout><HousingEDA /></ProjectLayout>} />
        <Route path="/housing/mlflow" element={<ProjectLayout><HousingMLflow /></ProjectLayout>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    </SidebarProvider>
  </QueryClientProvider>
);

export default App;
