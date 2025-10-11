import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Bell, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-secondary border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center gap-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">
              ML<span className="text-primary">Ops</span>
            </div>
          </Link>

          {/* Location */}
          <div className="hidden md:flex items-center gap-1 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="text-muted-foreground">Enviar a</span>
            <span className="font-medium">Producción</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                placeholder="Buscar modelos, pipelines y más..."
                className="w-full pr-10 bg-background"
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-0 top-0 h-full"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden lg:flex">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm">
              <ShoppingCart className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-sm border-t border-border py-2 overflow-x-auto">
          <Link 
            to="/" 
            className={`hover:text-primary transition-colors font-medium whitespace-nowrap ${isActive('/') ? 'text-primary' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/eda" 
            className={`hover:text-primary transition-colors whitespace-nowrap ${isActive('/eda') ? 'text-primary' : ''}`}
          >
            EDA Explorer
          </Link>
          <Link 
            to="/lineage" 
            className={`hover:text-primary transition-colors whitespace-nowrap ${isActive('/lineage') ? 'text-primary' : ''}`}
          >
            Data Lineage
          </Link>
          <Link 
            to="/mlflow" 
            className={`hover:text-primary transition-colors whitespace-nowrap ${isActive('/mlflow') ? 'text-primary' : ''}`}
          >
            MLflow
          </Link>
          <Link 
            to="/drift" 
            className={`hover:text-primary transition-colors whitespace-nowrap ${isActive('/drift') ? 'text-primary' : ''}`}
          >
            Drift Monitor
          </Link>
          <Link 
            to="/generator" 
            className={`hover:text-primary transition-colors whitespace-nowrap ${isActive('/generator') ? 'text-primary' : ''}`}
          >
            Data Generator
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
