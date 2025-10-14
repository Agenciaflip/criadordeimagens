import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreationWorkflow } from "@/components/CreationWorkflow";
import { Sparkles } from "lucide-react";

const Index = () => {

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient glow background */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-in fade-in-50 duration-700">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Powered by Gemini Nano Banana</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            AI Image Blender
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Mescle imagens de modelos e produtos com inteligência artificial de última geração
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="criar" className="space-y-8">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
              <TabsTrigger value="criar">Criar</TabsTrigger>
              <TabsTrigger value="modelos">Modelos</TabsTrigger>
              <TabsTrigger value="roupas">Roupas</TabsTrigger>
            </TabsList>

            <TabsContent value="criar">
              <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card">
                <CreationWorkflow />
              </div>
            </TabsContent>

            <TabsContent value="modelos">
              <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card">
                <h2 className="text-2xl font-semibold mb-6">Meus Modelos</h2>
                {/* TODO: Add SavedModels component */}
              </div>
            </TabsContent>

            <TabsContent value="roupas">
              <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card">
                <h2 className="text-2xl font-semibold mb-6">Minhas Roupas</h2>
                {/* TODO: Add SavedClothing component */}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
