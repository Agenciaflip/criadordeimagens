import { Wand2 } from "lucide-react";
import { Button } from "./ui/button";

interface MergeButtonProps {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
}

export const MergeButton = ({ onClick, disabled, loading }: MergeButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      size="lg"
      className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground shadow-primary transition-all duration-300 hover:shadow-glow hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
    >
      <Wand2 className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Mesclando com IA...' : 'Mesclar Imagens'}
    </Button>
  );
};
