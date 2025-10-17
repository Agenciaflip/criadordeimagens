import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Camera, Download } from "lucide-react";

interface PosePackGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creationId: string;
}

export const PosePackGenerator = ({
  open,
  onOpenChange,
  creationId,
}: PosePackGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [poses, setPoses] = useState<string[]>([]);

  const poseNames = [
    "Vista Frontal",
    "Vista Traseira", 
    "Perfil Lateral",
    "Macro Detalhe",
    "Ângulo 3/4"
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setPoses([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-pose-pack', {
        body: { creationId }
      });

      if (error) throw error;

      if (data?.poses) {
        setPoses(data.poses);
        toast.success("Pack de 5 poses gerado!");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      
      if (error.message?.includes('Rate limit')) {
        toast.error("Limite de requisições atingido. Tente novamente em alguns instantes.");
      } else if (error.message?.includes('Payment required')) {
        toast.error("Créditos insuficientes. Adicione créditos ao seu workspace.");
      } else {
        toast.error("Erro ao gerar poses");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `pose-${poseNames[index].toLowerCase().replace(/\s/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    poses.forEach((pose, index) => {
      setTimeout(() => handleDownload(pose, index), index * 500);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar Pack de 5 Poses</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando 5 poses...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Gerar Pack de 5 Poses
                </>
              )}
            </Button>

            {poses.length > 0 && (
              <Button
                onClick={handleDownloadAll}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Todas
              </Button>
            )}
          </div>

          {poses.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {poses.map((pose, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
                    <img
                      src={pose}
                      alt={poseNames[index]}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDownload(pose, index)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-medium text-center mt-2">
                    {poseNames[index]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
