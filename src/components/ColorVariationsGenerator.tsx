import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Palette, Download } from "lucide-react";

interface ColorVariationsGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clothingImage: string;
}

export const ColorVariationsGenerator = ({
  open,
  onOpenChange,
  clothingImage,
}: ColorVariationsGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [numberOfVariations, setNumberOfVariations] = useState("5");
  const [variations, setVariations] = useState<string[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setVariations([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-color-variations', {
        body: {
          clothingImage,
          numberOfVariations: parseInt(numberOfVariations)
        }
      });

      if (error) throw error;

      if (data?.variations) {
        setVariations(data.variations);
        toast.success(`${data.variations.length} variações geradas!`);
      }
    } catch (error: any) {
      console.error("Erro:", error);
      
      if (error.message?.includes('Rate limit')) {
        toast.error("Limite de requisições atingido. Tente novamente em alguns instantes.");
      } else if (error.message?.includes('Payment required')) {
        toast.error("Créditos insuficientes. Adicione créditos ao seu workspace.");
      } else {
        toast.error("Erro ao gerar variações");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `variacao-cor-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Variações de Cor</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Imagem Original</Label>
              <img
                src={clothingImage}
                alt="Original"
                className="w-full rounded-lg mt-2"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Número de Variações</Label>
                <Select
                  value={numberOfVariations}
                  onValueChange={setNumberOfVariations}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 variações</SelectItem>
                    <SelectItem value="5">5 variações</SelectItem>
                    <SelectItem value="7">7 variações</SelectItem>
                    <SelectItem value="10">10 variações</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Palette className="mr-2 h-4 w-4" />
                    Gerar Variações
                  </>
                )}
              </Button>
            </div>
          </div>

          {variations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4">Variações Geradas</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {variations.map((variation, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={variation}
                      alt={`Variação ${index + 1}`}
                      className="w-full rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDownload(variation, index)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
