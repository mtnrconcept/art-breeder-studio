import { useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Mic, Upload, X, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const LipSync = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [inputMode, setInputMode] = useState<'audio' | 'text'>('text');
  const [model, setModel] = useState<'sync-lipsync' | 'kling-lipsync'>('sync-lipsync');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultVideo, setResultVideo] = useState<string | null>(null);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImageUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleAudioUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setAudioUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const generateLipSync = async () => {
    if (!imageUrl) {
      toast({ title: 'Image requise', description: 'Veuillez télécharger une image', variant: 'destructive' });
      return;
    }

    if (inputMode === 'text' && !text.trim()) {
      toast({ title: 'Texte requis', description: 'Veuillez entrer le texte à prononcer', variant: 'destructive' });
      return;
    }

    if (inputMode === 'audio' && !audioUrl) {
      toast({ title: 'Audio requis', description: 'Veuillez télécharger un fichier audio', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setResultVideo(null);

    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 95));
    }, 3000);

    try {
      const { data, error } = await supabase.functions.invoke('lip-sync', {
        body: {
          imageUrl,
          audioUrl: inputMode === 'audio' ? audioUrl : undefined,
          text: inputMode === 'text' ? text : undefined,
          model,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultVideo(data.videoUrl);
      setProgress(100);
      toast({ title: 'Avatar généré !', description: 'Votre avatar parlant est prêt.' });
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mx-auto mb-6">
              <Mic className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Lip Sync</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Créez des avatars parlants réalistes à partir d'une image et d'un texte ou audio.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            {/* Image Upload */}
            <div>
              <Label>Photo de visage</Label>
              {imageUrl ? (
                <div className="relative mt-2 inline-block">
                  <img src={imageUrl} alt="Face" className="max-h-64 rounded-xl" />
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
                  <span className="text-sm text-muted-foreground">Télécharger une photo de visage</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Input Mode Tabs */}
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'audio' | 'text')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Texte
                </TabsTrigger>
                <TabsTrigger value="audio">
                  <Mic className="w-4 h-4 mr-2" />
                  Audio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-4">
                <Label htmlFor="text">Texte à prononcer</Label>
                <Textarea
                  id="text"
                  placeholder="Entrez le texte que l'avatar doit prononcer..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="mt-2 min-h-24"
                />
              </TabsContent>

              <TabsContent value="audio" className="mt-4">
                {audioUrl ? (
                  <div className="flex items-center gap-4">
                    <audio src={audioUrl} controls className="flex-1" />
                    <Button variant="destructive" size="icon" onClick={() => setAudioUrl(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                    <Mic className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-sm text-muted-foreground">Télécharger un fichier audio</span>
                    <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                  </label>
                )}
              </TabsContent>
            </Tabs>

            <div>
              <Label>Modèle</Label>
              <Select value={model} onValueChange={(v) => setModel(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sync-lipsync">Sync Lipsync</SelectItem>
                  <SelectItem value="kling-lipsync">Kling Lipsync</SelectItem>
                </SelectContent>
              </Select>
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
              onClick={generateLipSync}
              disabled={isGenerating || !imageUrl || (inputMode === 'text' ? !text.trim() : !audioUrl)}
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
                  <Mic className="w-4 h-4 mr-2" />
                  Créer l'avatar parlant
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

export default LipSync;