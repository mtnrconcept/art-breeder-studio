import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Wand2, Image, RefreshCw, Download, Copy, Settings2 } from 'lucide-react';

const aspectRatios = [
  { id: '1:1', label: '1:1 Square', width: 1024, height: 1024 },
  { id: '16:9', label: '16:9 Landscape', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16 Portrait', width: 1080, height: 1920 },
  { id: '4:3', label: '4:3 Standard', width: 1400, height: 1050 },
  { id: '3:2', label: '3:2 Photo', width: 1500, height: 1000 },
  { id: '21:9', label: '21:9 Cinematic', width: 2560, height: 1080 },
];

const stylePresets = [
  { id: 'photorealistic', label: 'Photorealistic', icon: '📷' },
  { id: 'cinematic', label: 'Cinematic', icon: '🎬' },
  { id: 'anime', label: 'Anime', icon: '🎨' },
  { id: 'digital-art', label: 'Digital Art', icon: '💻' },
  { id: 'oil-painting', label: 'Oil Painting', icon: '🖼️' },
  { id: 'watercolor', label: 'Watercolor', icon: '🌊' },
  { id: 'sketch', label: 'Sketch', icon: '✏️' },
  { id: '3d-render', label: '3D Render', icon: '🎮' },
  { id: 'fantasy', label: 'Fantasy', icon: '🧙' },
  { id: 'sci-fi', label: 'Sci-Fi', icon: '🚀' },
  { id: 'vintage', label: 'Vintage', icon: '📼' },
  { id: 'minimalist', label: 'Minimalist', icon: '⬜' },
];

const models = [
  { id: 'flux-pro', label: 'Flux Pro', description: 'Best quality' },
  { id: 'sdxl', label: 'SDXL', description: 'Fast & versatile' },
  { id: 'dalle-3', label: 'DALL-E 3', description: 'Creative' },
  { id: 'midjourney', label: 'Midjourney V6', description: 'Aesthetic' },
];

const TextToImage = () => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedModel, setSelectedModel] = useState('flux-pro');
  const [quality, setQuality] = useState([75]);
  const [creativity, setCreativity] = useState([50]);
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [numImages, setNumImages] = useState('4');

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    // Simulate generation
    setTimeout(() => {
      setGeneratedImages([
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=512&h=512&fit=crop',
        'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=512&h=512&fit=crop',
        'https://images.unsplash.com/photo-1633177317976-3f9bc45e1d1d?w=512&h=512&fit=crop',
        'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=512&h=512&fit=crop',
      ]);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">AI Image Generation</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              <span className="gradient-text">Text to Image</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transform your ideas into stunning visuals with advanced AI models
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Prompt Input */}
              <div className="tool-card p-6">
                <label className="block text-sm font-medium mb-3">Prompt</label>
                <Textarea
                  placeholder="Describe what you want to create..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Be descriptive: include style, lighting, mood, and details
                </p>
              </div>

              {/* Negative Prompt */}
              <div className="tool-card p-6">
                <label className="block text-sm font-medium mb-3">Negative Prompt</label>
                <Textarea
                  placeholder="What to avoid in the image..."
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>

              {/* Style Presets */}
              <div className="tool-card p-6">
                <label className="block text-sm font-medium mb-3">Style Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {stylePresets.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg border text-center transition-all ${
                        selectedStyle === style.id
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="text-xl mb-1 block">{style.icon}</span>
                      <span className="text-xs">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings */}
              <div className="tool-card p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.label}</span>
                            <span className="text-xs text-muted-foreground">({model.description})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Aspect Ratio</label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {aspectRatios.map((ratio) => (
                        <SelectItem key={ratio.id} value={ratio.id}>
                          {ratio.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Number of Images</label>
                  <Select value={numImages} onValueChange={setNumImages}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Image</SelectItem>
                      <SelectItem value="2">2 Images</SelectItem>
                      <SelectItem value="4">4 Images</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Quality</label>
                    <span className="text-sm text-muted-foreground">{quality[0]}%</span>
                  </div>
                  <Slider
                    value={quality}
                    onValueChange={setQuality}
                    min={25}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium">Creativity</label>
                    <span className="text-sm text-muted-foreground">{creativity[0]}%</span>
                  </div>
                  <Slider
                    value={creativity}
                    onValueChange={setCreativity}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Seed (optional)</label>
                  <input
                    type="text"
                    placeholder="Random seed for reproducibility"
                    value={seed}
                    onChange={(e) => setSeed(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-14 text-lg gradient-primary"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Images
                  </>
                )}
              </Button>
            </div>

            {/* Right Panel - Results */}
            <div className="lg:col-span-2">
              <div className="tool-card p-6 min-h-[600px]">
                {generatedImages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <Image className="w-12 h-12 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ready to Create</h3>
                    <p className="text-muted-foreground max-w-md">
                      Enter a prompt and click Generate to create stunning AI images. 
                      Your creations will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Generated Images</h3>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {generatedImages.map((img, index) => (
                        <div key={index} className="group relative rounded-xl overflow-hidden aspect-square">
                          <img
                            src={img}
                            alt={`Generated ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button size="sm" variant="secondary">
                              <Download className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="secondary">
                              <Copy className="w-4 h-4 mr-1" />
                              Vary
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isGenerating && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative w-20 h-20 mx-auto mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                      </div>
                      <p className="text-lg font-medium">Creating your masterpiece...</p>
                      <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TextToImage;
