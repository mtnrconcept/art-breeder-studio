import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Film, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ImageToVideo = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<'kling' | 'minimax' | 'veo3'>('kling');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const generateVideo = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', description: 'Veuillez télécharger une image', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResultVideo(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('generate-video', {
        body: {
          type: 'image-to-video',
          prompt: prompt || 'smooth cinematic motion',
          imageUrl,
          model,
          duration,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultVideo(data.videoUrl);
      setProgress(100);
      toast({ title: 'Vidéo générée !', description: 'Votre vidéo est prête.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de génération', variant: 'destructive' });
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-6">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Image to Video</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Animez vos images en vidéos fluides avec l'IA.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Image source</Label>
              {imageUrl ? (
                <div className="relative mt-2">
                  <img src={imageUrl} alt="Source" className="w-full max-h-80 object-contain rounded-xl" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setImageUrl(null)}
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
              <Label htmlFor="prompt">Description du mouvement (optionnel)</Label>
              <Textarea
                id="prompt"
                placeholder="Ex: La caméra zoome lentement, les feuilles bougent doucement dans le vent..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Modèle</Label>
                <Select value={model} onValueChange={(v) => setModel(v as any)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kling">Kling v1.6</SelectItem>
                    <SelectItem value="minimax">Minimax</SelectItem>
                    <SelectItem value="veo3">Veo3</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Durée</Label>
                <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v) as 5 | 10)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 secondes</SelectItem>
                    <SelectItem value="10">10 secondes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Génération en cours...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
                <p className="text-xs text-muted-foreground text-center">
                  La génération peut prendre 2-5 minutes
                </p>
              </div>
            )}

            <Button
              onClick={generateVideo}
              disabled={isGenerating || !imageUrl}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 mr-2" />
                  Animer l'image
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

export default ImageToVideo;