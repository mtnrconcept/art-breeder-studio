import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, Loader2, Download, Trash2, Home, Settings, Pause, Play, 
  HelpCircle, History, Shuffle, Maximize2, Plus, ImageIcon 
} from 'lucide-react';

const Splicer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [images, setImages] = useState<{ preview: string; weight: number }[]>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 4) {
      toast({ title: "Maximum 4 images", variant: "destructive" });
      return;
    }

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setImages(prev => [...prev, { preview: reader.result as string, weight: 50 }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const updateWeight = (index: number, weight: number) => {
    setImages(prev => prev.map((img, i) => i === index ? { ...img, weight } : img));
  };

  const handleSplice = async () => {
    if (images.length < 2) {
      toast({ title: "Ajoutez au moins 2 images", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const weightDescription = images.map((img, i) => 
        `Parent ${i + 1} contributes ${img.weight}% of visual genes`
      ).join('. ');

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: `Crossbreed these ${images.length} parent images. ${weightDescription}. Merge their visual genetics: blend colors, shapes, textures, and distinctive features from each parent proportionally to their weights.`,
          baseImages: images.map(d => d.preview),
          type: 'splice'
        }
      });

      if (error) throw error;

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
        toast({ title: "Images croisées génétiquement !" });
      }
    } catch (error) {
      console.error('Splice error:', error);
      toast({ title: "Erreur lors du croisement", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-image', {
        body: { prompt: 'Create a variation of this hybrid', baseImageUrl: generatedImage, type: 'splice' }
      });
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEnhance = async () => {
    if (!generatedImage) return;
    setIsGenerating(true);
    try {
      const { data } = await supabase.functions.invoke('generate-image', {
        body: { prompt: 'Enhance quality and details', baseImageUrl: generatedImage, type: 'tune' }
      });
      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        setHistoryItems((prev) => [data.imageUrl, ...prev.slice(0, 9)]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `splice-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Top Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full bg-primary/20 hover:bg-primary/30"
              onClick={() => navigate('/')}
            >
              <Home className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 backdrop-blur-sm">
              <Button variant="ghost" size="icon" className="rounded-full"><Settings className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => { setImages([]); setGeneratedImage(null); }}>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full"><HelpCircle className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full"><History className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={handleDownload} disabled={!generatedImage}>
                <Download className="h-4 w-4" />
              </Button>
            </div>

            <div className="w-10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-180px)]">
            {/* Center - Main Canvas */}
            <div className="lg:col-span-8 flex flex-col">
              <Card className="flex-1 glass overflow-hidden relative min-h-[400px]">
                {generatedImage ? (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full canvas-grid flex items-center justify-center">
                    {isGenerating ? (
                      <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Splicer</p>
                        <p className="text-sm text-muted-foreground/70 mt-2">Crossbreed images to create hybrids</p>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* Parent Images */}
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-semibold text-sm">Parent Images (2-4)</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => fileInputRef.current?.click()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                
                <div className="grid grid-cols-4 gap-3">
                  {images.map((img, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative group aspect-square">
                        <img src={img.preview} alt={`Parent ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-border/50" />
                        <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{img.weight}%</span>
                        <Slider value={[img.weight]} onValueChange={([v]) => updateWeight(index, v)} max={100} step={5} className="flex-1" />
                      </div>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center hover:border-primary/50 transition-colors bg-card/30">
                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Add</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <Button variant="outline" onClick={handleVary} disabled={!generatedImage || isGenerating} className="rounded-full px-6 bg-secondary/50">
                  <Shuffle className="mr-2 h-4 w-4" />Vary
                </Button>
                <Button onClick={handleSplice} disabled={isGenerating || images.length < 2} className="rounded-full px-8 gradient-primary text-white">
                  {isGenerating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Splicing...</> : 'Splice'}
                </Button>
                <Button variant="outline" onClick={handleEnhance} disabled={!generatedImage || isGenerating} className="rounded-full px-6 bg-emerald-500/20 border-emerald-500/50 text-emerald-400">
                  <Maximize2 className="mr-2 h-4 w-4" />Enhance
                </Button>
              </div>
            </div>

            {/* Right Panel - History */}
            <div className="lg:col-span-4 space-y-4">
              {historyItems.length > 0 && (
                <Card className="p-4 glass">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">History</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {historyItems.map((item, index) => (
                      <button key={index} onClick={() => setGeneratedImage(item)} className="aspect-square rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-colors">
                        <img src={item} alt={`History ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Splicer;
