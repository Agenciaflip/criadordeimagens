import { useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
  label: string;
  currentImage?: string;
}

export const ImageUpload = ({ onImageSelect, label, currentImage }: ImageUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    onImageSelect("");
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300",
          isDragging 
            ? "border-primary bg-primary/10 scale-[1.02]" 
            : "border-border bg-secondary/50 hover:border-primary/50",
          currentImage ? "aspect-square" : "aspect-video"
        )}
      >
        {currentImage ? (
          <div className="relative w-full h-full group">
            <img 
              src={currentImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 p-2 rounded-full bg-destructive/90 text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer p-8">
            <Upload className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Arraste e solte ou <span className="text-primary font-medium">clique para fazer upload</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">PNG, JPG, WEBP</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </label>
        )}
      </div>
    </div>
  );
};
