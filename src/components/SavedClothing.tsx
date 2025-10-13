import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClothingItem {
  id: string;
  name: string;
  type: string;
  color: string;
  image_url: string;
}

interface SavedClothingProps {
  onSelectClothing: (imageUrl: string) => void;
  selectedClothingImage?: string;
}

export const SavedClothing = ({ onSelectClothing, selectedClothingImage }: SavedClothingProps) => {
  const [clothing, setClothing] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClothing = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("clothing_items")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setClothing(data || []);
    } catch (error) {
      console.error("Erro ao carregar roupas:", error);
      toast.error("Erro ao carregar roupas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClothing();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("clothing_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Peça excluída");
      loadClothing();
    } catch (error) {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir peça");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (clothing.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma peça salva ainda. Crie sua primeira peça!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {clothing.map((item) => (
        <Card
          key={item.id}
          className={`group relative cursor-pointer transition-all hover:shadow-lg ${
            selectedClothingImage === item.image_url ? "ring-2 ring-primary" : ""
          }`}
          onClick={() => onSelectClothing(item.image_url)}
        >
          <div className="aspect-square relative overflow-hidden rounded-t-lg">
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(item.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3">
            <p className="font-semibold text-sm truncate">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.type} - {item.color}
            </p>
          </div>
        </Card>
      ))}
    </div>
  );
};
