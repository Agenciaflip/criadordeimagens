import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { toast } from "sonner";

interface SavedModel {
  id: string;
  name: string;
  image_url: string;
  gender: string;
  ethnicity: string;
  age_range: string;
  body_type: string;
  hair_color: string;
  hair_style: string;
  skin_tone: string;
}

interface SavedModelsProps {
  onSelectModel: (imageUrl: string) => void;
  selectedModelImage?: string;
}

export const SavedModels = ({ onSelectModel, selectedModelImage }: SavedModelsProps) => {
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);

  const loadModels = async () => {
    try {
      const { data, error } = await supabase
        .from('models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModels(data || []);
    } catch (error) {
      console.error('Erro ao carregar modelos:', error);
      toast.error('Erro ao carregar modelos salvos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('models')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Modelo excluído com sucesso');
      loadModels();
    } catch (error) {
      console.error('Erro ao excluir modelo:', error);
      toast.error('Erro ao excluir modelo');
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando modelos...</div>;
  }

  if (models.length === 0) {
    return (
      <div className="text-center text-muted-foreground p-8 rounded-xl bg-secondary/50">
        Nenhum modelo salvo ainda. Crie seu primeiro modelo!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {models.map((model) => (
        <Card 
          key={model.id} 
          className={`relative group cursor-pointer transition-all duration-300 hover:shadow-lg overflow-hidden ${
            selectedModelImage === model.image_url ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelectModel(model.image_url)}
        >
          <div className="aspect-square relative">
            <img
              src={model.image_url}
              alt={model.name}
              className="w-full h-full object-cover"
            />
            {selectedModelImage === model.image_url && (
              <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                <Check className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <h3 className="text-white text-sm font-medium truncate">{model.name}</h3>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(model.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
