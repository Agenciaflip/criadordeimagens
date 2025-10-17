import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles, ArrowLeft, ArrowRight, Save, FileText, Palette, Camera } from "lucide-react";
import { ModelCreator, ModelCharacteristics } from "./ModelCreator";
import { SavedModels } from "./SavedModels";
import { ClothingCreator, ClothingCharacteristics } from "./ClothingCreator";
import { SavedClothing } from "./SavedClothing";
import { SaveModelDialog } from "./SaveModelDialog";
import { SaveClothingDialog } from "./SaveClothingDialog";
import { MarketplaceContentGenerator } from "./MarketplaceContentGenerator";
import { ColorVariationsGenerator } from "./ColorVariationsGenerator";
import { PosePackGenerator } from "./PosePackGenerator";

type Step = "model" | "clothing" | "scene" | "result";

interface SceneSettings {
  pose: string;
  scenario: string;
  lighting: string;
  style: string;
}

export const CreationWorkflow = () => {
  const [step, setStep] = useState<Step>("model");
  const [useExistingModel, setUseExistingModel] = useState(false);
  const [useExistingClothing, setUseExistingClothing] = useState(false);
  
  const [modelImage, setModelImage] = useState("");
  const [modelCharacteristics, setModelCharacteristics] = useState<ModelCharacteristics | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  
  const [clothingImage, setClothingImage] = useState("");
  const [clothingCharacteristics, setClothingCharacteristics] = useState<ClothingCharacteristics | null>(null);
  const [selectedClothingId, setSelectedClothingId] = useState<string | null>(null);
  
  const [sceneSettings, setSceneSettings] = useState<SceneSettings>({
    pose: "frontal",
    scenario: "studio",
    lighting: "studio",
    style: "editorial"
  });
  
  const [generatedImage, setGeneratedImage] = useState("");
  const [generatedCreationId, setGeneratedCreationId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [showSaveModelDialog, setShowSaveModelDialog] = useState(false);
  const [showSaveClothingDialog, setShowSaveClothingDialog] = useState(false);
  const [showMarketplaceGenerator, setShowMarketplaceGenerator] = useState(false);
  const [showColorVariations, setShowColorVariations] = useState(false);
  const [showPosePack, setShowPosePack] = useState(false);

  const handleModelGenerated = (imageUrl: string, characteristics: ModelCharacteristics) => {
    setModelImage(imageUrl);
    setModelCharacteristics(characteristics);
    toast.success("Modelo gerado!");
  };

  const handleClothingGenerated = (imageUrl: string, characteristics: ClothingCharacteristics) => {
    setClothingImage(imageUrl);
    setClothingCharacteristics(characteristics);
    toast.success("Roupa gerada!");
  };

  const handleModelSelected = (imageUrl: string) => {
    setModelImage(imageUrl);
    // TODO: Buscar model_id do banco quando selecionado
  };

  const handleClothingSelected = (imageUrl: string) => {
    setClothingImage(imageUrl);
    // TODO: Buscar clothing_id do banco quando selecionado
  };

  const canProceedFromModel = modelImage !== "";
  const canProceedFromClothing = clothingImage !== "";

  const handleGenerateCreation = async () => {
    if (!modelImage || !clothingImage) {
      toast.error("Modelo e roupa são necessários");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('merge-images', {
        body: {
          modelImage,
          productImage: clothingImage,
          sceneSettings
        }
      });

      if (error) throw error;

      if (data?.mergedImage) {
        setGeneratedImage(data.mergedImage);
        
        // Salvar criação no banco
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: creationData } = await supabase.from("creations").insert({
            user_id: user.id,
            model_id: selectedModelId,
            clothing_id: selectedClothingId,
            image_url: data.mergedImage,
            pose: sceneSettings.pose,
            scenario: sceneSettings.scenario,
            lighting: sceneSettings.lighting,
            style: sceneSettings.style,
          }).select().single();
          
          if (creationData) {
            setGeneratedCreationId(creationData.id);
            
            // Auto-gerar título e descrição para marketplace
            try {
              const contentResponse = await supabase.functions.invoke('generate-marketplace-content', {
                body: {
                  clothingName: clothingCharacteristics?.description || "Peça de roupa",
                  clothingType: "peça personalizada",
                  clothingStyle: sceneSettings.style,
                  clothingColor: "conforme imagem"
                }
              });
              
              if (contentResponse.data) {
                const { title: generatedTitle, description: generatedDescription } = contentResponse.data;
                setTitle(generatedTitle);
                setDescription(generatedDescription);
                
                // Atualizar no banco imediatamente
                await supabase.from("creations").update({
                  title: generatedTitle,
                  description: generatedDescription
                }).eq("id", creationData.id);
                
                toast.success("Título e descrição gerados automaticamente!");
              }
            } catch (contentError: any) {
              console.error("Erro ao gerar conteúdo:", contentError);
              // Não bloquear o fluxo se falhar
            }
          }
        }
        
        setStep("result");
        toast.success("Criação gerada com sucesso!");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      toast.error("Erro ao gerar criação");
    } finally {
      setLoading(false);
    }
  };

  const resetWorkflow = () => {
    setStep("model");
    setModelImage("");
    setClothingImage("");
    setGeneratedImage("");
    setGeneratedCreationId("");
    setTitle("");
    setDescription("");
    setUseExistingModel(false);
    setUseExistingClothing(false);
  };

  const handleContentGenerated = async (newTitle: string, newDescription: string) => {
    setTitle(newTitle);
    setDescription(newDescription);
    
    // Atualizar no banco
    if (generatedCreationId) {
      await supabase.from("creations").update({
        title: newTitle,
        description: newDescription
      }).eq("id", generatedCreationId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex justify-center gap-2 mb-8">
        {["model", "clothing", "scene", "result"].map((s, idx) => (
          <div
            key={s}
            className={`h-2 w-16 rounded-full transition-all ${
              step === s ? "bg-primary" : idx < ["model", "clothing", "scene", "result"].indexOf(step) ? "bg-primary/50" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Model Selection */}
      {step === "model" && (
        <div className="space-y-6 animate-in fade-in-50">
          <h2 className="text-2xl font-bold">Passo 1: Escolha o Modelo</h2>
          
          <div className="flex gap-4 mb-6">
            <Button
              variant={!useExistingModel ? "default" : "outline"}
              onClick={() => setUseExistingModel(false)}
            >
              Criar Novo Modelo
            </Button>
            <Button
              variant={useExistingModel ? "default" : "outline"}
              onClick={() => setUseExistingModel(true)}
            >
              Usar Modelo Salvo
            </Button>
          </div>

          {!useExistingModel ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ModelCreator onModelGenerated={handleModelGenerated} />
              {modelImage && (
                <div className="p-6 rounded-2xl bg-gradient-card border border-border">
                  <img src={modelImage} alt="Modelo gerado" className="w-full rounded-lg" />
                  <Button
                    onClick={() => setShowSaveModelDialog(true)}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Modelo
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <SavedModels onSelectModel={handleModelSelected} selectedModelImage={modelImage} />
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep("clothing")}
              disabled={!canProceedFromModel}
            >
              Próximo: Escolher Roupa <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Clothing Selection */}
      {step === "clothing" && (
        <div className="space-y-6 animate-in fade-in-50">
          <h2 className="text-2xl font-bold">Passo 2: Escolha a Roupa</h2>
          
          <div className="flex gap-4 mb-6">
            <Button
              variant={!useExistingClothing ? "default" : "outline"}
              onClick={() => setUseExistingClothing(false)}
            >
              Criar Nova Roupa
            </Button>
            <Button
              variant={useExistingClothing ? "default" : "outline"}
              onClick={() => setUseExistingClothing(true)}
            >
              Usar Roupa Salva
            </Button>
          </div>

          {!useExistingClothing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ClothingCreator onClothingGenerated={handleClothingGenerated} />
              {clothingImage && (
                <div className="p-6 rounded-2xl bg-gradient-card border border-border">
                  <img src={clothingImage} alt="Roupa gerada" className="w-full rounded-lg" />
                  <Button
                    onClick={() => setShowSaveClothingDialog(true)}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Roupa
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <SavedClothing onSelectClothing={handleClothingSelected} selectedClothingImage={clothingImage} />
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("model")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button
              onClick={() => setStep("scene")}
              disabled={!canProceedFromClothing}
            >
              Próximo: Configurar Cena <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Scene Configuration */}
      {step === "scene" && (
        <div className="space-y-6 animate-in fade-in-50">
          <h2 className="text-2xl font-bold">Passo 3: Configure a Cena</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label>Pose</Label>
                <Select value={sceneSettings.pose} onValueChange={(v) => setSceneSettings(prev => ({ ...prev, pose: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontal">Frontal</SelectItem>
                    <SelectItem value="lateral">Lateral</SelectItem>
                    <SelectItem value="3-4">3/4</SelectItem>
                    <SelectItem value="costas">Costas</SelectItem>
                    <SelectItem value="sentado">Sentado</SelectItem>
                    <SelectItem value="caminhando">Caminhando</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cenário</Label>
                <Select value={sceneSettings.scenario} onValueChange={(v) => setSceneSettings(prev => ({ ...prev, scenario: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Estúdio</SelectItem>
                    <SelectItem value="rua">Rua Urbana</SelectItem>
                    <SelectItem value="praia">Praia</SelectItem>
                    <SelectItem value="parque">Parque</SelectItem>
                    <SelectItem value="indoor">Interior</SelectItem>
                    <SelectItem value="white-background">Fundo Branco</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Iluminação</Label>
                <Select value={sceneSettings.lighting} onValueChange={(v) => setSceneSettings(prev => ({ ...prev, lighting: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="studio">Estúdio</SelectItem>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="dramatica">Dramática</SelectItem>
                    <SelectItem value="golden-hour">Golden Hour</SelectItem>
                    <SelectItem value="soft">Suave</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estilo</Label>
                <Select value={sceneSettings.style} onValueChange={(v) => setSceneSettings(prev => ({ ...prev, style: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editorial">Editorial</SelectItem>
                    <SelectItem value="comercial">Comercial</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="high-fashion">High Fashion</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Modelo:</p>
                <img src={modelImage} alt="Modelo" className="w-full rounded" />
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm font-medium mb-2">Roupa:</p>
                <img src={clothingImage} alt="Roupa" className="w-full rounded" />
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("clothing")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button onClick={handleGenerateCreation} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Criação
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === "result" && (
        <div className="space-y-6 animate-in fade-in-50">
          <h2 className="text-2xl font-bold">Criação Finalizada!</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <img src={generatedImage} alt="Resultado" className="w-full rounded-lg" />
              
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowColorVariations(true)}
                >
                  <Palette className="mr-2 h-4 w-4" />
                  Cores
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPosePack(true)}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  5 Poses
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMarketplaceGenerator(true)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Conteúdo
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Camiseta Básica Vermelha"
                />
              </div>

              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição do produto..."
                  rows={6}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={resetWorkflow} className="flex-1">
                  Nova Criação
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      {modelCharacteristics && (
        <SaveModelDialog
          open={showSaveModelDialog}
          onOpenChange={setShowSaveModelDialog}
          imageUrl={modelImage}
          characteristics={modelCharacteristics}
          onSaved={() => {}}
        />
      )}

      {clothingCharacteristics && (
        <SaveClothingDialog
          open={showSaveClothingDialog}
          onOpenChange={setShowSaveClothingDialog}
          imageUrl={clothingImage}
          characteristics={clothingCharacteristics}
          onSaved={() => {}}
        />
      )}

      <MarketplaceContentGenerator
        open={showMarketplaceGenerator}
        onOpenChange={setShowMarketplaceGenerator}
        creationId={generatedCreationId}
        currentTitle={title}
        currentDescription={description}
        onContentGenerated={handleContentGenerated}
      />

      <ColorVariationsGenerator
        open={showColorVariations}
        onOpenChange={setShowColorVariations}
        creationImage={generatedImage}
      />

      <PosePackGenerator
        open={showPosePack}
        onOpenChange={setShowPosePack}
        creationId={generatedCreationId}
      />
    </div>
  );
};
