import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

export interface ClothingCharacteristics {
  name: string;
  type: string;
  color: string;
  style: string;
  pattern: string;
  fabric: string;
}

interface ClothingCreatorProps {
  onClothingGenerated: (imageUrl: string, characteristics: ClothingCharacteristics) => void;
}

export const ClothingCreator = ({ onClothingGenerated }: ClothingCreatorProps) => {
  const [loading, setLoading] = useState(false);
  const [characteristics, setCharacteristics] = useState<ClothingCharacteristics>({
    name: "",
    type: "camiseta",
    color: "branco",
    style: "casual",
    pattern: "liso",
    fabric: "algodão",
  });

  const updateCharacteristic = (key: keyof ClothingCharacteristics, value: string) => {
    setCharacteristics(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!characteristics.name.trim()) {
      toast.error("Por favor, insira um nome para a peça");
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

  return (
    <div className="p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Criar Peça de Roupa</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Nome da Peça</Label>
          <Input
            value={characteristics.name}
            onChange={(e) => updateCharacteristic("name", e.target.value)}
            placeholder="Ex: Camiseta Básica Branca"
          />
        </div>

        <div>
          <Label>Tipo</Label>
          <Select value={characteristics.type} onValueChange={(v) => updateCharacteristic("type", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="camiseta">Camiseta</SelectItem>
              <SelectItem value="calça">Calça</SelectItem>
              <SelectItem value="vestido">Vestido</SelectItem>
              <SelectItem value="jaqueta">Jaqueta</SelectItem>
              <SelectItem value="saia">Saia</SelectItem>
              <SelectItem value="shorts">Shorts</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Cor</Label>
          <Select value={characteristics.color} onValueChange={(v) => updateCharacteristic("color", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="branco">Branco</SelectItem>
              <SelectItem value="preto">Preto</SelectItem>
              <SelectItem value="azul">Azul</SelectItem>
              <SelectItem value="vermelho">Vermelho</SelectItem>
              <SelectItem value="verde">Verde</SelectItem>
              <SelectItem value="amarelo">Amarelo</SelectItem>
              <SelectItem value="cinza">Cinza</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Estilo</Label>
          <Select value={characteristics.style} onValueChange={(v) => updateCharacteristic("style", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="formal">Formal</SelectItem>
              <SelectItem value="esportivo">Esportivo</SelectItem>
              <SelectItem value="elegante">Elegante</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Padrão</Label>
          <Select value={characteristics.pattern} onValueChange={(v) => updateCharacteristic("pattern", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="liso">Liso</SelectItem>
              <SelectItem value="estampado">Estampado</SelectItem>
              <SelectItem value="listrado">Listrado</SelectItem>
              <SelectItem value="xadrez">Xadrez</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tecido</Label>
          <Select value={characteristics.fabric} onValueChange={(v) => updateCharacteristic("fabric", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="algodão">Algodão</SelectItem>
              <SelectItem value="jeans">Jeans</SelectItem>
              <SelectItem value="seda">Seda</SelectItem>
              <SelectItem value="poliéster">Poliéster</SelectItem>
              <SelectItem value="linho">Linho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Peça
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
