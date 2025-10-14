import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

interface Creation {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  pose: string | null;
  scenario: string | null;
  created_at: string;
}

interface CreationsGalleryProps {
  onSelectCreation: (creation: Creation) => void;
}

export const CreationsGallery = ({ onSelectCreation }: CreationsGalleryProps) => {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCreations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("creations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCreations(data || []);
    } catch (error) {
      console.error("Erro ao carregar criações:", error);
      toast.error("Erro ao carregar criações");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreations();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("creations")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Criação excluída");
      loadCreations();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir criação");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (creations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma criação ainda. Faça sua primeira criação!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {creations.map((creation) => (
        <Card
          key={creation.id}
          className="group relative cursor-pointer transition-all hover:shadow-lg"
          onClick={() => onSelectCreation(creation)}
        >
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            <img
              src={creation.image_url}
              alt={creation.title || "Criação"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCreation(creation);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(creation.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="p-3">
            <p className="font-semibold text-sm truncate">
              {creation.title || "Sem título"}
            </p>
            <p className="text-xs text-muted-foreground">
              {creation.pose && `${creation.pose} - `}
              {creation.scenario || "Criação"}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
