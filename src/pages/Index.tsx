import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pipeline from "@/components/Pipeline";
import Metrics from "@/components/Metrics";
import APIDemo from "@/components/APIDemo";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <Pipeline />
      <Metrics />
      <APIDemo />
      <Footer />
    </div>
  );
};

export default Index;
