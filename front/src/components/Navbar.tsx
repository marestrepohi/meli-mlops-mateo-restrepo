import { Input } from "@/components/ui/input";
import { Search, Bell, User } from "lucide-react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    <header className="bg-primary border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo - Left */}
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/mercado_credito.png" 
              alt="Mercado Crédito" 
              className="h-10 w-auto"
            />
          </Link>

          {/* Title - Center */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-lg font-semibold text-primary-foreground">MLOps Platform</span>
          </div>

          {/* Actions - Right */}
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary-foreground cursor-pointer" />
            <User className="w-5 h-5 text-primary-foreground cursor-pointer" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
