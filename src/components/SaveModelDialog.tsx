import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ModelCharacteristics } from "./ModelCreator";

interface SaveModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  characteristics: ModelCharacteristics;
  onSaved: () => void;
}

export const SaveModelDialog = ({ 
  open, 
  onOpenChange, 
  imageUrl, 
  characteristics,
  onSaved 
}: SaveModelDialogProps) => {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Por favor, insira um nome para o modelo");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('models')
        .insert({
          name: name.trim(),
          image_url: imageUrl,
          gender: characteristics.gender,
          ethnicity: characteristics.ethnicity,
          age_range: characteristics.ageRange,
          body_type: characteristics.bodyType,
          hair_color: characteristics.hairColor,
          hair_style: characteristics.hairStyle,
          skin_tone: characteristics.skinTone,
        });

      if (error) throw error;

      toast.success("Modelo salvo com sucesso!");
      setName("");
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error("Erro ao salvar modelo:", error);
      toast.error("Erro ao salvar modelo");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar Modelo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Modelo</Label>
            <Input
              id="name"
              placeholder="Ex: Modelo Verão 2024"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
