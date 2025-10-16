import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  label?: string;
  accept?: string;
}

export const ImageUpload = ({ onImageSelect, label = "Fazer Upload de Imagem", accept = "image/*" }: ImageUploadProps) => {
  const [preview, setPreview] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelect(result);
      toast.success("Imagem carregada com sucesso");
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {!preview ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Clique para fazer upload ou arraste a imagem
          </p>
          <p className="text-xs text-muted-foreground">
            PNG, JPG, WEBP até 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full rounded-lg border border-border"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={handleClear}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
