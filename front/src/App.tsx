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

// Housing Project Pages
import HousingProject from "./pages/HousingProject";
import HousingAPIDemo from "./pages/HousingAPIDemo";
import HousingPipeline from "./pages/HousingPipeline";
import HousingExperiments from "./pages/HousingExperiments";
import HousingMonitoring from "./pages/HousingMonitoring";
import HousingEDA from "./pages/HousingEDA";
import HousingMLflow from "./pages/HousingMLflow";

const queryClient = new QueryClient();

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="flex">
      <Sidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout><Index /></Layout>} />
        <Route path="/projects" element={<Layout><Project /></Layout>} />
        <Route path="/models" element={<Layout><Models /></Layout>} />
        <Route path="/pipelines" element={<Layout><Pipelines /></Layout>} />
        <Route path="/runs" element={<Layout><Runs /></Layout>} />
        <Route path="/artifacts" element={<Layout><Artifacts /></Layout>} />
        
        {/* Housing Price Prediction Project Routes */}
        <Route path="/housing" element={<Layout><HousingProject /></Layout>} />
        <Route path="/housing/api-demo" element={<Layout><HousingAPIDemo /></Layout>} />
        <Route path="/housing/pipeline" element={<Layout><HousingPipeline /></Layout>} />
        <Route path="/housing/experiments" element={<Layout><HousingExperiments /></Layout>} />
        <Route path="/housing/monitoring" element={<Layout><HousingMonitoring /></Layout>} />
        <Route path="/housing/eda" element={<Layout><HousingEDA /></Layout>} />
        <Route path="/housing/mlflow" element={<Layout><HousingMLflow /></Layout>} />
        
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
