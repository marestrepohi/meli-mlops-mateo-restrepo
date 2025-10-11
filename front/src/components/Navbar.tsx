import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Bell, MapPin } from "lucide-react";

const Navbar = () => {
  return (
    <header className="bg-secondary border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center gap-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">
              ML<span className="text-primary">Ops</span>
            </div>
          </div>

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

        {/* Navigation - Simplified */}
        <nav className="flex items-center gap-6 text-sm border-t border-border py-2">
          <button className="hover:text-primary transition-colors font-medium">
            Dashboard
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
