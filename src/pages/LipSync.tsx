import { useState, useCallback, useRef } from 'react';
import { VideoToolLayout } from '@/components/tools/VideoToolLayout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Mic, MessageSquare, Upload, X } from 'lucide-react';
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
  const [history, setHistory] = useState<string[]>([]);
  const audioInputRef = useRef<HTMLInputElement>(null);

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
      setHistory(prev => [data.videoUrl, ...prev].slice(0, 8));
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

  const controlsPanel = (
    <div className="space-y-4">
      {/* Input Mode Tabs */}
      <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'audio' | 'text')}>
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="text" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Texte
          </TabsTrigger>
          <TabsTrigger value="audio" className="text-xs">
            <Mic className="w-3 h-3 mr-1" />
            Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="mt-3">
          <Textarea
            placeholder="Entrez le texte que l'avatar doit prononcer..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-20 text-sm resize-none"
          />
        </TabsContent>

        <TabsContent value="audio" className="mt-3">
          <input
            ref={audioInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />
          {audioUrl ? (
            <div className="flex items-center gap-2">
              <audio src={audioUrl} controls className="flex-1 h-9" />
              <Button variant="destructive" size="icon" className="h-9 w-9" onClick={() => setAudioUrl(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() => audioInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 transition-colors bg-card/30"
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Télécharger audio</span>
            </button>
          )}
        </TabsContent>
      </Tabs>

      {/* Model Select */}
      <div>
        <Label className="text-xs text-muted-foreground">Modèle</Label>
        <Select value={model} onValueChange={(v) => setModel(v as any)}>
          <SelectTrigger className="mt-1 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sync-lipsync">Sync Lipsync</SelectItem>
            <SelectItem value="kling-lipsync">Kling Lipsync</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <VideoToolLayout
      title="Lip Sync"
      description="Créez des avatars parlants réalistes à partir d'une image et d'un texte ou audio."
      icon={<Mic className="w-10 h-10 text-white" />}
      iconGradient="bg-gradient-to-br from-pink-500 to-rose-500"
      sourceMedia={imageUrl}
      sourceMediaType="image"
      onSourceMediaChange={setImageUrl}
      sourceMediaLabel="Photo de visage"
      resultVideo={resultVideo}
      isProcessing={isGenerating}
      progress={progress}
      onGenerate={generateLipSync}
      generateLabel="Créer l'avatar"
      generateDisabled={!imageUrl || (inputMode === 'text' ? !text.trim() : !audioUrl)}
      controlsPanel={controlsPanel}
      hidePrompt
      historyItems={history}
      onHistorySelect={(item) => setResultVideo(item)}
    />
  );
};

export default LipSync;
