import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/hooks/use-toast';
import { Loader2, Download, Music, Volume2, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const SoundGenerator = () => {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<'sound-effect' | 'music' | 'speech'>('sound-effect');
  const [duration, setDuration] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultAudio, setResultAudio] = useState<string | null>(null);

  const generateSound = async () => {
    if (!prompt.trim()) {
      toast({ title: 'Description requise', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('sound-generator', {
        body: {
          prompt,
          type,
          duration,
          text: type === 'speech' ? prompt : undefined,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResultAudio(data.audioUrl);
      toast({ title: 'Audio généré !', description: 'Votre audio est prêt.' });
    } catch (error: any) {
      console.error('Error:', error);
      toast({ title: 'Erreur', description: error.message || 'Erreur de génération', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mx-auto mb-6">
              <Music className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4">
              <span className="gradient-text">Sound Generator</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Générez des effets sonores, de la musique ou de la parole avec l'IA.
            </p>
          </div>

          <div className="glass-card p-8 space-y-6">
            <div>
              <Label>Type de son</Label>
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sound-effect">
                    <span className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Effet sonore
                    </span>
                  </SelectItem>
                  <SelectItem value="music">
                    <span className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Musique
                    </span>
                  </SelectItem>
                  <SelectItem value="speech">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Parole (TTS)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="prompt">
                {type === 'speech' ? 'Texte à prononcer' : 'Description du son'}
              </Label>
              <Textarea
                id="prompt"
                placeholder={
                  type === 'speech'
                    ? "Bonjour, je suis un assistant virtuel..."
                    : type === 'music'
                    ? "Une mélodie électronique douce et apaisante..."
                    : "Le bruit d'une explosion, une porte qui grince..."
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="mt-2 min-h-24"
              />
            </div>

            {type !== 'speech' && (
              <div>
                <div className="flex justify-between mb-2">
                  <Label>Durée: {duration} secondes</Label>
                </div>
                <Slider
                  value={[duration]}
                  onValueChange={(v) => setDuration(v[0])}
                  min={5}
                  max={type === 'sound-effect' ? 47 : 30}
                  step={1}
                />
              </div>
            )}

            <Button
              onClick={generateSound}
              disabled={isGenerating || !prompt.trim()}
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
                  <Music className="w-4 h-4 mr-2" />
                  Générer le son
                </>
              )}
            </Button>

            {resultAudio && (
              <div className="mt-8 space-y-4">
                <Label>Résultat</Label>
                <div className="bg-muted/50 rounded-xl p-4">
                  <audio src={resultAudio} controls className="w-full" />
                </div>
                <Button asChild variant="outline" className="w-full">
                  <a href={resultAudio} download="generated-audio.mp3" target="_blank" rel="noopener noreferrer">
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

export default SoundGenerator;