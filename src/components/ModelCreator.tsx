import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelCreatorProps {
  onModelGenerated: (imageUrl: string, characteristics: ModelCharacteristics) => void;
}

export interface ModelCharacteristics {
  gender: string;
  ethnicity: string;
  ageRange: string;
  bodyType: string;
  hairColor: string;
  hairStyle: string;
  skinTone: string;
}

export const ModelCreator = ({ onModelGenerated }: ModelCreatorProps) => {
  const [characteristics, setCharacteristics] = useState<ModelCharacteristics>({
    gender: "female",
    ethnicity: "caucasian",
    ageRange: "25-35",
    bodyType: "athletic",
    hairColor: "brown",
    hairStyle: "long straight",
    skinTone: "medium"
  });
  const [loading, setLoading] = useState(false);

  const updateCharacteristic = (key: keyof ModelCharacteristics, value: string) => {
    setCharacteristics(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-model`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(characteristics),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar modelo');
      }

      const data = await response.json();
      onModelGenerated(data.modelImage, characteristics);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6 rounded-2xl bg-gradient-card backdrop-blur-sm border border-border shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Criar Modelo com IA</h2>
      </div>

      <div className="space-y-4">
        {/* Gênero */}
        <div className="space-y-2">
          <Label>Gênero</Label>
          <RadioGroup value={characteristics.gender} onValueChange={(value) => updateCharacteristic('gender', value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="cursor-pointer">Feminino</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="cursor-pointer">Masculino</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Etnia */}
        <div className="space-y-2">
          <Label>Etnia</Label>
          <Select value={characteristics.ethnicity} onValueChange={(value) => updateCharacteristic('ethnicity', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="caucasian">Caucasiano</SelectItem>
              <SelectItem value="african">Africano</SelectItem>
              <SelectItem value="asian">Asiático</SelectItem>
              <SelectItem value="latino">Latino</SelectItem>
              <SelectItem value="middle-eastern">Oriente Médio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Faixa Etária */}
        <div className="space-y-2">
          <Label>Faixa Etária</Label>
          <Select value={characteristics.ageRange} onValueChange={(value) => updateCharacteristic('ageRange', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18-25">18-25 anos</SelectItem>
              <SelectItem value="25-35">25-35 anos</SelectItem>
              <SelectItem value="35-45">35-45 anos</SelectItem>
              <SelectItem value="45-60">45-60 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tipo Corporal */}
        <div className="space-y-2">
          <Label>Tipo Corporal</Label>
          <Select value={characteristics.bodyType} onValueChange={(value) => updateCharacteristic('bodyType', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slim">Magro</SelectItem>
              <SelectItem value="athletic">Atlético</SelectItem>
              <SelectItem value="curvy">Curvilíneo</SelectItem>
              <SelectItem value="plus-size">Plus Size</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cor do Cabelo */}
        <div className="space-y-2">
          <Label>Cor do Cabelo</Label>
          <Select value={characteristics.hairColor} onValueChange={(value) => updateCharacteristic('hairColor', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="black">Preto</SelectItem>
              <SelectItem value="brown">Castanho</SelectItem>
              <SelectItem value="blonde">Loiro</SelectItem>
              <SelectItem value="red">Ruivo</SelectItem>
              <SelectItem value="gray">Grisalho</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estilo do Cabelo */}
        <div className="space-y-2">
          <Label>Estilo do Cabelo</Label>
          <Select value={characteristics.hairStyle} onValueChange={(value) => updateCharacteristic('hairStyle', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="short">Curto</SelectItem>
              <SelectItem value="long straight">Longo Liso</SelectItem>
              <SelectItem value="long wavy">Longo Ondulado</SelectItem>
              <SelectItem value="long curly">Longo Cacheado</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tom de Pele */}
        <div className="space-y-2">
          <Label>Tom de Pele</Label>
          <Select value={characteristics.skinTone} onValueChange={(value) => updateCharacteristic('skinTone', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fair">Claro</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="olive">Oliva</SelectItem>
              <SelectItem value="tan">Bronzeado</SelectItem>
              <SelectItem value="deep">Escuro</SelectItem>
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
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando Modelo...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Modelo
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
