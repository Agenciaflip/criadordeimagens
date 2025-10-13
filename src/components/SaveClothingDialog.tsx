import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ClothingCharacteristics } from "./ClothingCreator";

interface SaveClothingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  characteristics: ClothingCharacteristics;
  onSaved: () => void;
}

export const SaveClothingDialog = ({
  open,
  onOpenChange,
  imageUrl,
  characteristics,
  onSaved,
}: SaveClothingDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(characteristics.name);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Por favor, insira um nome para a peça");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("clothing_items").insert({
        user_id: user.id,
        name: name.trim(),
        type: characteristics.type,
        color: characteristics.color,
        style: characteristics.style,
        pattern: characteristics.pattern,
        fabric: characteristics.fabric,
        image_url: imageUrl,
      });

      if (error) throw error;

      toast.success("Peça salva com sucesso!");
      onSaved();
      onOpenChange(false);
      setName("");
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar peça");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Peça de Roupa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Peça</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Camiseta Básica Branca"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
