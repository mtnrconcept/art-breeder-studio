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
import { useImageGeneration } from '@/hooks/useImageGeneration';
import { supabase } from '@/integrations/supabase/client';
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
  Maximize2
} from 'lucide-react';

const Composer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { generateImage, isGenerating, progress } = useImageGeneration();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [baseImage, setBaseImage] = useState<string | null>(null);
  const [styleStrength, setStyleStrength] = useState([50]);
  const [faceStrength, setFaceStrength] = useState([50]);
  const [contentStrength, setContentStrength] = useState([50]);
  const [activeTab, setActiveTab] = useState('style');
  const [isPaused, setIsPaused] = useState(false);
  const [historyItems, setHistoryItems] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        variant: 'destructive',
        title: 'Prompt required',
        description: 'Please enter a description for your image.'
      });
      return;
    }

    // Composer: Mix images and text with precision - compose visual elements on a canvas
    const composerPrompt = baseImage 
      ? `Compose this image with the following creative direction: ${prompt}. Blend the visual elements with ${styleStrength[0]}% style influence, preserving ${faceStrength[0]}% of facial features if present, and ${contentStrength[0]}% content fidelity.`
      : prompt;

    const result = await generateImage({
      prompt: composerPrompt,
      baseImageUrl: baseImage || undefined,
      styleStrength: styleStrength[0],
      faceStrength: faceStrength[0],
      contentStrength: contentStrength[0]
    });

    if (result) {
      setGeneratedImage(result.imageUrl);
      setHistoryItems((prev) => [result.imageUrl, ...prev.slice(0, 9)]);
      toast({
        title: 'Image generated!',
        description: 'Your creation has been saved to your gallery.'
      });
    }
  };

  const handleBaseImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVary = async () => {
    if (!generatedImage) return;
    const result = await generateImage({
      prompt: `Create a variation: ${prompt}`,
      baseImageUrl: generatedImage
    });
    if (result) {
      setGeneratedImage(result.imageUrl);
      setHistoryItems((prev) => [result.imageUrl, ...prev.slice(0, 9)]);
    }
  };

  const handleEnhance = async () => {
    if (!generatedImage) return;
    const result = await generateImage({
      prompt: 'Enhance and improve the quality of this image, make it more detailed and vibrant',
      baseImageUrl: generatedImage
    });
    if (result) {
      setGeneratedImage(result.imageUrl);
      setHistoryItems((prev) => [result.imageUrl, ...prev.slice(0, 9)]);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `artbreeder-${Date.now()}.png`;
    link.click();
  };

  const handleClear = () => {
    setGeneratedImage(null);
    setPrompt('');
    setBaseImage(null);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">
            
            {/* Left Panel - Controls */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto">
              {/* Prompt Input */}
              <Card className="p-4 glass">
                <Label className="text-sm text-muted-foreground mb-2 block">Description</Label>
                <Textarea
                  placeholder="Describe what you want to create... e.g., 'a majestic hippopotamus in a fantasy forest'"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none bg-input border-border"
                />
                <Button 
                  onClick={handleGenerate} 
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full mt-4 gradient-primary"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating... {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate
                    </>
                  )}
                </Button>
              </Card>

              {/* Base Image */}
              <Card className="p-4 glass">
                <Label className="text-sm text-muted-foreground mb-2 block">Base Image (optional)</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBaseImageUpload}
                  className="hidden"
                />
                
                {baseImage ? (
                  <div className="relative group">
                    <img 
                      src={baseImage} 
                      alt="Base" 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setBaseImage(null)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Upload Image</span>
                  </button>
                )}

                {/* Strength Controls */}
                {baseImage && (
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="style">Style</TabsTrigger>
                      <TabsTrigger value="face">Face</TabsTrigger>
                      <TabsTrigger value="content">Content</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="style" className="mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Style Strength</span>
                          <span className="text-primary">{styleStrength[0]}%</span>
                        </div>
                        <Slider
                          value={styleStrength}
                          onValueChange={setStyleStrength}
                          max={100}
                          step={1}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="face" className="mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Face Strength</span>
                          <span className="text-primary">{faceStrength[0]}%</span>
                        </div>
                        <Slider
                          value={faceStrength}
                          onValueChange={setFaceStrength}
                          max={100}
                          step={1}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="content" className="mt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Content Strength</span>
                          <span className="text-primary">{contentStrength[0]}%</span>
                        </div>
                        <Slider
                          value={contentStrength}
                          onValueChange={setContentStrength}
                          max={100}
                          step={1}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                )}
              </Card>
            </div>

            {/* Center - Canvas */}
            <div className="lg:col-span-6 flex flex-col">
              <Card className="flex-1 glass overflow-hidden relative">
                {generatedImage ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={generatedImage} 
                      alt="Generated" 
                      className="w-full h-full object-contain"
                    />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                          <p className="text-muted-foreground">Generating... {progress}%</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full canvas-grid flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Your creation will appear here</p>
                      <p className="text-sm text-muted-foreground/70 mt-2">
                        Enter a description and click Generate
                      </p>
                    </div>
                  </div>
                )}
              </Card>

              {/* Toolbar */}
              <div className="flex items-center justify-between mt-4 px-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" title="Settings">
                    <Settings className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleClear} title="Clear">
                    <Trash2 className="h-5 w-5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsPaused(!isPaused)}
                    title={isPaused ? 'Resume' : 'Pause'}
                  >
                    {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                  </Button>
                  <Button variant="ghost" size="icon" title="Help">
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    onClick={handleVary}
                    disabled={!generatedImage || isGenerating}
                  >
                    <Shuffle className="mr-2 h-4 w-4" />
                    Vary
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleEnhance}
                    disabled={!generatedImage || isGenerating}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Enhance
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={handleDownload}
                    disabled={!generatedImage}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel - History */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto">
              <Card className="p-4 glass">
                <div className="flex items-center gap-2 mb-4">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">History</span>
                </div>
                
                {historyItems.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {historyItems.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setGeneratedImage(item)}
                        className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                      >
                        <img 
                          src={item} 
                          alt={`History ${index + 1}`} 
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No history yet</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Composer;
