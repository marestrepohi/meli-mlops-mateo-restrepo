import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code, Copy, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const APIDemo = () => {
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const curlExample = `curl -X POST https://api.mlops-platform.com/predict \\
  -H "Content-Type: application/json" \\
  -d '{
    "features": [0.00632, 18.0, 2.31, 0, 0.538, 
                 6.575, 65.2, 4.09, 1, 296.0]
  }'`;

  const pythonExample = `import requests

response = requests.post(
  'https://api.mlops-platform.com/predict',
  json={'features': [0.00632, 18.0, 2.31, 0, 0.538, 
                     6.575, 65.2, 4.09, 1, 296.0]}
)
print(response.json())`;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const handlePredict = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResponse(JSON.stringify({
        prediction: 24.5,
        confidence: 0.947,
        model_version: "v2.4.1",
        inference_time_ms: 87
      }, null, 2));
      setLoading(false);
      toast.success("Prediction completed!");
    }, 1500);
  };

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-muted/20 to-background">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            REST <span className="bg-gradient-accent bg-clip-text text-transparent">API</span> Endpoint
          </h2>
          <p className="text-xl text-muted-foreground">
            Production-ready inference API with FastAPI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">cURL</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCopy(curlExample)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <pre className="bg-background p-4 rounded-lg text-xs overflow-x-auto border border-border">
              <code className="text-muted-foreground">{curlExample}</code>
            </pre>
          </Card>

          <Card className="p-6 bg-card border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Python</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => handleCopy(pythonExample)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <pre className="bg-background p-4 rounded-lg text-xs overflow-x-auto border border-border">
              <code className="text-muted-foreground">{pythonExample}</code>
            </pre>
          </Card>
        </div>

        <Card className="mt-6 p-8 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">Try it Live</h3>
            <Button 
              variant="accent" 
              onClick={handlePredict}
              disabled={loading}
            >
              <Play className="w-4 h-4" />
              {loading ? "Predicting..." : "Run Prediction"}
            </Button>
          </div>

          {response && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground mb-2">Response:</div>
                <pre className="bg-background p-4 rounded-lg text-sm border border-primary/20">
                  <code className="text-accent">{response}</code>
                </pre>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  <span className="text-muted-foreground">Status: Success</span>
                </div>
                <div className="text-muted-foreground">
                  Predicted Price: <span className="text-foreground font-semibold">$24.5K</span>
                </div>
              </div>
            </div>
          )}

          {!response && (
            <div className="p-8 border border-dashed border-border rounded-lg text-center">
              <p className="text-muted-foreground">
                Click "Run Prediction" to see the API response
              </p>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default APIDemo;
