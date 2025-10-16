import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Upload, Scissors } from "lucide-react";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface ClothingCharacteristics {
  description: string;
}

interface ClothingCreatorProps {
  onClothingGenerated: (imageUrl: string, characteristics: ClothingCharacteristics) => void;
}

export const ClothingCreator = ({ onClothingGenerated }: ClothingCreatorProps) => {
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [characteristics, setCharacteristics] = useState<ClothingCharacteristics>({
    description: "",
  });

  const handleGenerate = async () => {
    if (!characteristics.description.trim()) {
      toast.error("Por favor, descreva a peça de roupa");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-clothing', {
        body: { characteristics }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        onClothingGenerated(data.imageUrl, characteristics);
      }
    } catch (error: any) {
      console.error("Erro ao gerar peça:", error);
      toast.error("Erro ao gerar peça");
    } finally {
      setLoading(false);
    }
  };

  const handleExtractClothing = async (uploadedImageUrl: string) => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-clothing', {
        body: { imageUrl: uploadedImageUrl }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        onClothingGenerated(data.imageUrl, { description: "Peça extraída de foto" });
        toast.success("Peça extraída com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro ao extrair peça:", error);
      toast.error("Erro ao extrair peça da foto");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Escolher Peça de Roupa</h3>
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar com IA
          </TabsTrigger>
          <TabsTrigger value="extract">
            <Scissors className="w-4 h-4 mr-2" />
            Extrair de Foto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="extract" className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">
              <strong>Como funciona:</strong> Faça upload de uma foto onde apareça a peça de roupa 
              (pode estar em modelo, manequim, ou cabide). A IA irá extrair a peça e colocá-la 
              em um fundo branco profissional.
            </p>
          </div>
          
          <ImageUpload
            label="Upload da Foto com a Peça de Roupa"
            onImageSelect={handleExtractClothing}
          />
          
          {extracting && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Extraindo peça de roupa...</span>
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-lg mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>Descreva a peça de roupa que você deseja criar:</strong>
            </p>
            <p className="text-xs text-muted-foreground">
              Inclua detalhes como: tipo da peça, cor, estilo, tecido, padrões, detalhes especiais.
              Exemplo: "Camiseta feminina de algodão na cor azul marinho, gola redonda, manga curta, 
              com estampa minimalista de montanhas brancas no peito, corte reto, tecido leve"
            </p>
          </div>

          <div>
            <Label>Descrição Completa da Peça</Label>
            <Textarea
              value={characteristics.description}
              onChange={(e) => setCharacteristics({ description: e.target.value })}
              placeholder="Ex: Vestido midi floral de viscose, cor predominante rosa claro com flores pequenas coloridas, decote V, manga bufante 3/4, cintura marcada com cinto fino incluso, saia evasê..."
              rows={6}
              className="resize-none"
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Peça...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar Peça com IA
              </>
            )}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};
