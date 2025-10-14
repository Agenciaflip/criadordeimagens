import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, Copy, Check } from "lucide-react";

interface MarketplaceContentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creationId: string;
  currentTitle?: string;
  currentDescription?: string;
  onContentGenerated: (title: string, description: string) => void;
}

export const MarketplaceContentGenerator = ({
  open,
  onOpenChange,
  creationId,
  currentTitle,
  currentDescription,
  onContentGenerated,
}: MarketplaceContentGeneratorProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(currentTitle || "");
  const [description, setDescription] = useState(currentDescription || "");
  const [tags, setTags] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-marketplace-content', {
        body: { creationId }
      });

      if (error) throw error;

      if (data) {
        setTitle(data.title || "");
        setDescription(data.description || "");
        setTags(data.tags?.join(", ") || "");
        toast.success("Conteúdo gerado com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      
      if (error.message?.includes('Rate limit')) {
        toast.error("Limite de requisições atingido. Tente novamente em alguns instantes.");
      } else if (error.message?.includes('Payment required')) {
        toast.error("Créditos insuficientes. Adicione créditos ao seu workspace.");
      } else {
        toast.error("Erro ao gerar conteúdo");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = () => {
    onContentGenerated(title, description);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerar Conteúdo para Marketplace</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
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
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar com IA
              </>
            )}
          </Button>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Título</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(title, 'title')}
                disabled={!title}
              >
                {copiedField === 'title' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título otimizado para marketplace"
            />
            <p className="text-xs text-muted-foreground">
              {title.length} caracteres (ideal: 50-80)
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Descrição</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(description, 'description')}
                disabled={!description}
              >
                {copiedField === 'description' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada do produto"
              rows={8}
            />
            <p className="text-xs text-muted-foreground">
              {description.length} caracteres
            </p>
          </div>

          {tags && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tags</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(tags, 'tags')}
                >
                  {copiedField === 'tags' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags separadas por vírgula"
              />
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Salvar
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
