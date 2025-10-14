import { Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 px-4 border-t border-border bg-card/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4 bg-gradient-primary bg-clip-text text-transparent">
              MLOps Platform
            </h3>
            <p className="text-sm text-muted-foreground">
              Enterprise-grade machine learning operations platform for production deployments.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">Features</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Pipelines</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">API Docs</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Pricing</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="hover:text-foreground transition-colors cursor-pointer">Documentation</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Tutorials</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">GitHub</li>
              <li className="hover:text-foreground transition-colors cursor-pointer">Community</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-all hover:shadow-glow">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-all hover:shadow-glow">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted hover:bg-primary/20 transition-all hover:shadow-glow">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 MLOps Platform. Built for Mercado Libre technical challenge.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
