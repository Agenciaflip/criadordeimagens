import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Palette, Download } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface ColorVariationsGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creationImage: string;
}

const AVAILABLE_COLORS = [
  { value: "vermelho", label: "Vermelho", hex: "#DC2626" },
  { value: "azul", label: "Azul", hex: "#2563EB" },
  { value: "verde", label: "Verde", hex: "#16A34A" },
  { value: "amarelo", label: "Amarelo", hex: "#EAB308" },
  { value: "rosa", label: "Rosa", hex: "#EC4899" },
  { value: "roxo", label: "Roxo", hex: "#9333EA" },
  { value: "laranja", label: "Laranja", hex: "#EA580C" },
  { value: "preto", label: "Preto", hex: "#000000" },
  { value: "branco", label: "Branco", hex: "#FFFFFF" },
  { value: "cinza", label: "Cinza", hex: "#6B7280" },
  { value: "bege", label: "Bege", hex: "#D4A574" },
  { value: "marrom", label: "Marrom", hex: "#78350F" },
  { value: "navy", label: "Navy", hex: "#1E3A8A" },
  { value: "turquesa", label: "Turquesa", hex: "#14B8A6" },
  { value: "coral", label: "Coral", hex: "#F87171" },
  { value: "vinho", label: "Vinho", hex: "#881337" },
];

export const ColorVariationsGenerator = ({
  open,
  onOpenChange,
  creationImage,
}: ColorVariationsGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [variations, setVariations] = useState<string[]>([]);

  const toggleColor = (color: string) => {
    setSelectedColors(prev =>
      prev.includes(color)
        ? prev.filter(c => c !== color)
        : [...prev, color]
    );
  };

  const handleGenerate = async () => {
    if (selectedColors.length === 0) {
      toast.error("Selecione pelo menos uma cor");
      return;
    }

    setLoading(true);
    setVariations([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-color-variations', {
        body: {
          creationImage,
          selectedColors
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
                src={creationImage}
                alt="Original"
                className="w-full rounded-lg mt-2"
              />
            </div>

            <div className="space-y-4">
              <div>
                <Label>Selecione as Cores ({selectedColors.length} selecionadas)</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-64 overflow-y-auto p-2 border rounded-md">
                  {AVAILABLE_COLORS.map((color) => (
                    <div
                      key={color.value}
                      className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                      onClick={() => toggleColor(color.value)}
                    >
                      <Checkbox
                        checked={selectedColors.includes(color.value)}
                        onCheckedChange={() => toggleColor(color.value)}
                      />
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-sm">{color.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || selectedColors.length === 0}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando {selectedColors.length} variações...
                  </>
                ) : (
                  <>
                    <Palette className="mr-2 h-4 w-4" />
                    Gerar {selectedColors.length} Variações
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
