import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Palette, Camera } from "lucide-react";

interface Creation {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  pose: string | null;
  scenario: string | null;
  lighting: string | null;
  style: string | null;
  created_at: string;
}

interface CreationDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creation: Creation | null;
  onGenerateColorVariations?: (creationId: string) => void;
  onGeneratePosePack?: (creationId: string) => void;
}

export const CreationDetailModal = ({
  open,
  onOpenChange,
  creation,
  onGenerateColorVariations,
  onGeneratePosePack,
}: CreationDetailModalProps) => {
  if (!creation) return null;

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = creation.image_url;
    link.download = `${creation.title || 'criacao'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{creation.title || "Criação"}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={creation.image_url}
              alt={creation.title || "Criação"}
              className="w-full rounded-lg"
            />
          </div>

          <div className="space-y-4">
            {creation.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-sm text-muted-foreground">{creation.description}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Detalhes</h3>
              <div className="space-y-1 text-sm">
                {creation.pose && (
                  <p><span className="font-medium">Pose:</span> {creation.pose}</p>
                )}
                {creation.scenario && (
                  <p><span className="font-medium">Cenário:</span> {creation.scenario}</p>
                )}
                {creation.lighting && (
                  <p><span className="font-medium">Iluminação:</span> {creation.lighting}</p>
                )}
                {creation.style && (
                  <p><span className="font-medium">Estilo:</span> {creation.style}</p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Criado em {new Date(creation.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Baixar Imagem
              </Button>

              {onGenerateColorVariations && (
                <Button
                  onClick={() => onGenerateColorVariations(creation.id)}
                  variant="outline"
                  className="w-full"
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Gerar Variações de Cor
                </Button>
              )}

              {onGeneratePosePack && (
                <Button
                  onClick={() => onGeneratePosePack(creation.id)}
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Gerar Pack de 5 Poses
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
