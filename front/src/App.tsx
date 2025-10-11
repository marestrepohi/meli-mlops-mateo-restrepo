import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ModelDetail from "./pages/ModelDetail";
import EDAExplorer from "./pages/EDAExplorer";
import DataLineage from "./pages/DataLineage";
import MLflowViewer from "./pages/MLflowViewer";
import DriftMonitor from "./pages/DriftMonitor";
import DataGenerator from "./pages/DataGenerator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/model/:id" element={<ModelDetail />} />
          <Route path="/eda" element={<EDAExplorer />} />
          <Route path="/lineage" element={<DataLineage />} />
          <Route path="/mlflow" element={<MLflowViewer />} />
          <Route path="/drift" element={<DriftMonitor />} />
          <Route path="/generator" element={<DataGenerator />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
