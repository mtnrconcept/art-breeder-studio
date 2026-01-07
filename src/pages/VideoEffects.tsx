import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Wand2, Upload, X, Move, RotateCcw, Zap, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const VideoEffects = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [effect, setEffect] = useState<'camera-motion' | 'style-transfer' | 'slow-motion' | 'loop' | 'depth'>('camera-motion');
  const [prompt, setPrompt] = useState('');
  const [cameraMotion, setCameraMotion] = useState({
    horizontal: 0,
    vertical: 0,
    zoom: 0,
    pan: 0,
    tilt: 0,
    roll: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
        setResultVideo(null);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const applyEffect = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('video-effects', {
        body: {
          imageUrl,
          effect,
          prompt: prompt || undefined,
          cameraMotion: effect === 'camera-motion' ? cameraMotion : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultVideo(data.videoUrl);
      setProgress(100);
      toast({ title: 'Effet appliqué !', description: 'Votre vidéo est prête.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de traitement', variant: 'destructive' });
    } finally {
      clearInterval(progressInterval);
      setIsProcessing(false);
    }
  };

  const effectIcons = {
    'camera-motion': Camera,
    'style-transfer': Wand2,
    'slow-motion': RotateCcw,
    'loop': Zap,
    'depth': Move,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Video Effects</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Appliquez des effets cinématiques à vos images.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div>
              <Label>Image source</Label>
              {imageUrl ? (
                <div className="relative mt-2 inline-block">
                  <img src={imageUrl} alt="Source" className="max-h-64 rounded-xl" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => { setImageUrl(null); setResultVideo(null); }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="mt-2 flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Cliquez pour télécharger</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <Label>Effet</Label>
              <Select value={effect} onValueChange={(v) => setEffect(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="camera-motion">
                    <span className="flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      Mouvement de caméra
                    </span>
                  </SelectItem>
                  <SelectItem value="style-transfer">
                    <span className="flex items-center gap-2">
                      <Wand2 className="w-4 h-4" />
                      Transfert de style
                    </span>
                  </SelectItem>
                  <SelectItem value="slow-motion">
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Slow motion
                    </span>
                  </SelectItem>
                  <SelectItem value="loop">
                    <span className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Loop parfait
                    </span>
                  </SelectItem>
                  <SelectItem value="depth">
                    <span className="flex items-center gap-2">
                      <Move className="w-4 h-4" />
                      Effet de profondeur
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {effect === 'camera-motion' && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-xl">
                <Label>Contrôles de caméra</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">Horizontal: {cameraMotion.horizontal}</Label>
                    <Slider
                      value={[cameraMotion.horizontal]}
                      onValueChange={(v) => setCameraMotion(prev => ({ ...prev, horizontal: v[0] }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vertical: {cameraMotion.vertical}</Label>
                    <Slider
                      value={[cameraMotion.vertical]}
                      onValueChange={(v) => setCameraMotion(prev => ({ ...prev, vertical: v[0] }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Zoom: {cameraMotion.zoom}</Label>
                    <Slider
                      value={[cameraMotion.zoom]}
                      onValueChange={(v) => setCameraMotion(prev => ({ ...prev, zoom: v[0] }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Pan: {cameraMotion.pan}</Label>
                    <Slider
                      value={[cameraMotion.pan]}
                      onValueChange={(v) => setCameraMotion(prev => ({ ...prev, pan: v[0] }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Tilt: {cameraMotion.tilt}</Label>
                    <Slider
                      value={[cameraMotion.tilt]}
                      onValueChange={(v) => setCameraMotion(prev => ({ ...prev, tilt: v[0] }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Roll: {cameraMotion.roll}</Label>
                    <Slider
                      value={[cameraMotion.roll]}
                      onValueChange={(v) => setCameraMotion(prev => ({ ...prev, roll: v[0] }))}
                      min={-10}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            )}

            {effect === 'style-transfer' && (
              <div>
                <Label htmlFor="prompt">Style souhaité</Label>
                <Textarea
                  id="prompt"
                  placeholder="Ex: Style anime, peinture à l'huile impressionniste..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-2"
                />
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Traitement en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={applyEffect}
              disabled={isProcessing || !imageUrl}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Traitement...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Appliquer l'effet
                </>
              )}
            </Button>

            {resultVideo && (
              <div className="mt-8 space-y-4">
                <Label>Résultat</Label>
                <div className="rounded-xl overflow-hidden bg-black/50">
                  <video src={resultVideo} controls autoPlay loop className="w-full" />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={resultVideo} download target="_blank" rel="noopener noreferrer">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VideoEffects;