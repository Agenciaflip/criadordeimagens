import { Download, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface ResultDisplayProps {
  imageUrl: string;
}

export const ResultDisplay = ({ imageUrl }: ResultDisplayProps) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `merged-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Resultado da Mesclagem</h3>
      </div>
      
      <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-secondary/50 to-secondary/30 p-1 shadow-card">
        <div className="bg-card rounded-lg overflow-hidden">
          <img 
            src={imageUrl} 
            alt="Merged result" 
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      <Button
        onClick={downloadImage}
        variant="outline"
        className="w-full border-primary/50 hover:bg-primary/10 hover:border-primary transition-all duration-300"
      >
        <Download className="mr-2 h-4 w-4" />
        Baixar Imagem
      </Button>
    </div>
  );
};
