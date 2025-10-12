import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { MergeButton } from "@/components/MergeButton";
import { ResultDisplay } from "@/components/ResultDisplay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [modelImage, setModelImage] = useState<string>("");
  const [productImage, setProductImage] = useState<string>("");
  const [mergedImage, setMergedImage] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleMerge = async () => {
    if (!modelImage || !productImage) {
      toast.error("Por favor, faça upload de ambas as imagens");
      return;
    }

    setLoading(true);
    setMergedImage("");

    try {
      console.log("Iniciando mesclagem de imagens...");
      
      const { data, error } = await supabase.functions.invoke('merge-images', {
        body: {
          modelImage,
          productImage,
        }
      });

      if (error) {
        console.error("Erro ao mesclar imagens:", error);
        
        if (error.message.includes('Rate limit')) {
          toast.error("Limite de requisições atingido. Tente novamente em alguns instantes.");
        } else if (error.message.includes('Payment required')) {
          toast.error("Créditos insuficientes. Adicione créditos ao seu workspace.");
        } else {
          toast.error("Erro ao mesclar imagens. Tente novamente.");
        }
        return;
      }

      if (data?.mergedImage) {
        console.log("Mesclagem concluída com sucesso!");
        setMergedImage(data.mergedImage);
        toast.success("Imagens mescladas com sucesso!");
      } else {
        toast.error("Nenhuma imagem foi gerada");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao processar as imagens");
    } finally {
      setLoading(false);
    }
  };

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
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Upload Cards */}
            <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card transition-all duration-300 hover:shadow-primary/20">
              <ImageUpload
                label="Imagem da Modelo"
                onImageSelect={setModelImage}
                currentImage={modelImage}
              />
            </div>

            <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card transition-all duration-300 hover:shadow-primary/20">
              <ImageUpload
                label="Imagem do Produto"
                onImageSelect={setProductImage}
                currentImage={productImage}
              />
            </div>
          </div>

          {/* Merge Button */}
          <div className="mb-12">
            <MergeButton
              onClick={handleMerge}
              disabled={!modelImage || !productImage}
              loading={loading}
            />
          </div>

          {/* Result Display */}
          {mergedImage && (
            <div className="p-8 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card">
              <ResultDisplay imageUrl={mergedImage} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
