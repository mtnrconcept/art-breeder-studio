
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Settings,
  Trash2,
  Pause,
  Play,
  HelpCircle,
  History,
  Download,
  Plus,
  Sparkles,
  Loader2,
  Upload,
  ImageIcon,
  Shuffle,
  Maximize2,
  AlertCircle,
  Palette,
  User,
  Box
} from 'lucide-react';
import { composeImages, textToImage } from '@/lib/gemini';
import { AspectRatioSelector, AspectRatio } from '@/components/shared/AspectRatioSelector';
import { getImageDimensions } from '@/lib/utils';

const Composer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Refs for file inputs
  const baseInputRef = useRef<HTMLInputElement>(null);
  const styleInputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);
  const objInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [detectedDimensions, setDetectedDimensions] = useState<{ width: number, height: number } | undefined>();

  // Image states
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [styleImage, setStyleImage] = useState<string | null>(null);
  const [charImage, setCharImage] = useState<string | null>(null);
  const [objImage, setObjImage] = useState<string | null>(null);

  const [styleStrength, setStyleStrength] = useState([50]);
  const [contentStrength, setContentStrength] = useState([50]);

  const [activeTab, setActiveTab] = useState('layers');
  const [isPaused, setIsPaused] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Prompt required', description: 'Please enter a description.' });
      return;
    }

    setIsGenerating(true);
    setError(null);

    const hasReferences = baseImage || styleImage || charImage || objImage;

    try {
      let result;
      if (hasReferences) {
        result = await composeImages(
          baseImage ? [baseImage] : [],
          prompt,
          {
            styleStrength: styleStrength[0],
            contentStrength: contentStrength[0],
            styleImages: styleImage ? [styleImage] : [],
            characterImages: charImage ? [charImage] : [],
            objectImages: objImage ? [objImage] : [],
            aspectRatio,
            width: detectedDimensions?.width,
            height: detectedDimensions?.height
          }
        );
      } else {
        result = await textToImage(prompt);
      }

      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        setHistoryItems((prev) => [result.imageUrl!, ...prev.slice(0, 9)]);
        toast({ title: 'Image generated!', description: 'Saved to gallery.' });
      } else {
        const errorMsg = result.error || 'Failed to generate image';
        setError(errorMsg);
        toast({ variant: 'destructive', title: 'Generation Failed', description: errorMsg });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string | null) => void, isBase: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const b64 = reader.result as string;
        setter(b64);
        if (isBase) {
          try {
            const dims = await getImageDimensions(b64);
            setDetectedDimensions(dims);
            if (dims.width > dims.height) setAspectRatio('16:9');
            else if (dims.height > dims.width) setAspectRatio('9:16');
            else setAspectRatio('1:1');
          } catch (e) {
            console.error("Dim detection failed", e);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const result = await textToImage(`Variation of: ${prompt}`, { style: 'photorealistic' });
      if (result.success && result.imageUrl) {
        setGeneratedImage(result.imageUrl);
        setHistoryItems((prev) => [result.imageUrl!, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => { /* Same as before */ };
  const handleDownload = () => { /* Same as before */
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `artbreeder-${Date.now()}.png`;
    link.click();
  };
  const handleClear = () => {
    setGeneratedImage(null); setPrompt(''); setBaseImage(null);
    setStyleImage(null); setCharImage(null); setObjImage(null);
  };

  if (!user) return null;

  // Helper for upload slot
  const UploadSlot = ({ label, icon: Icon, image, setImage, inputRef, colorClass }: any) => (
    <div className="relative group">
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <input ref={inputRef} type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setImage, label === "Base")} className="hidden" />

      {image ? (
        <div className="relative aspect-square w-full">
          <img src={image} alt={label} className="w-full h-full object-cover rounded-md border border-border" />
          <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setImage(null)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()} className={`w-full aspect-square border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-1 hover:bg-accent/50 transition-colors ${colorClass}`}>
          <Icon className="h-6 w-6 opacity-50" />
          <span className="text-[10px] opacity-70">Add</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">

            {/* Left Panel - Inputs */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2">
              <Card className="p-4 glass space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Prompt</Label>
                  <Textarea
                    placeholder="Describe the final result..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] resize-none bg-input/50 border-input"
                  />
                </div>

                <div>
                  <AspectRatioSelector
                    value={aspectRatio}
                    onChange={setAspectRatio}
                    customDimensions={detectedDimensions}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    Reference Images
                    <div className="h-px bg-border flex-1" />
                  </Label>

                  <div className="grid grid-cols-2 gap-3">
                    <UploadSlot label="Base Structure" icon={ImageIcon} image={baseImage} setImage={setBaseImage} inputRef={baseInputRef} />
                    <UploadSlot label="Style Reference" icon={Palette} image={styleImage} setImage={setStyleImage} inputRef={styleInputRef} colorClass="text-purple-400" />
                    <UploadSlot label="Character/Face" icon={User} image={charImage} setImage={setCharImage} inputRef={charInputRef} colorClass="text-blue-400" />
                    <UploadSlot label="Object/Prop" icon={Box} image={objImage} setImage={setObjImage} inputRef={objInputRef} colorClass="text-orange-400" />
                  </div>
                </div>

                <div className="pt-2">
                  <Label className="text-xs text-muted-foreground flex justify-between mb-2">
                    <span>Influence Strength</span>
                    <span>{styleStrength}%</span>
                  </Label>
                  <Slider value={styleStrength} onValueChange={setStyleStrength} max={100} step={1} />
                </div>

                <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full mt-2 gradient-primary">
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Compose
                </Button>
              </Card>
            </div>

            {/* Center - Canvas */}
            <div className="lg:col-span-6 flex flex-col">
              <Card className="flex-1 glass overflow-hidden relative border-border/50">
                {generatedImage ? (
                  <div className="relative w-full h-full p-4 flex items-center justify-center bg-black/20">
                    <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded shadow-lg" />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                          <p className="text-muted-foreground font-medium animate-pulse">Mixing concepts...</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/40">
                    <div className="relative">
                      <Palette className="h-20 w-20 absolute -left-10 opacity-20" />
                      <User className="h-20 w-20 absolute -right-10 opacity-20" />
                      <Sparkles className="h-24 w-24 relative z-10" />
                    </div>
                    <p className="mt-6 text-lg font-medium">Composer Mode</p>
                    <p className="text-sm opacity-70 max-w-xs text-center mt-2">Combine styles, characters, and objects into a unique creation.</p>
                  </div>
                )}
              </Card>

              {/* Bottom Toolbar */}
              <div className="flex justify-between items-center mt-4 px-2">
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={handleClear}><Trash2 className="h-5 w-5" /></Button>
                  <Button variant="ghost" size="icon" disabled><Settings className="h-5 w-5" /></Button>
                </div>
                {generatedImage && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleVary} disabled={isGenerating}><Shuffle className="mr-2 h-4 w-4" /> Vary</Button>
                    <Button variant="secondary" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Save</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - History */}
            <div className="lg:col-span-3 overflow-y-auto pl-2">
              <Card className="p-4 glass h-full">
                <Label className="text-sm font-medium mb-4 block flex items-center gap-2">
                  <History className="h-4 w-4" /> Recent Creations
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {historyItems.map((item, i) => (
                    <button key={i} onClick={() => setGeneratedImage(item)} className="aspect-square rounded-md overflow-hidden border border-border/50 hover:border-primary transition-colors relative group">
                      <img src={item} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Composer;
