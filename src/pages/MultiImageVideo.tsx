import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, Wand2, RefreshCw, Download, Play, Plus, X, Users, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useVideoGeneration } from '@/hooks/use-video-generation';

const MultiImageVideo = () => {
    const [images, setImages] = useState<{ id: string; url: string; role: string }[]>([]);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState('5');
    const [quality, setQuality] = useState('pro');
    const { isGenerating, videoUrl: generatedVideo, error, createVideo, setVideoUrl: setGeneratedVideo } = useVideoGeneration();
    const { toast } = useToast();

    const roles = [
        { id: 'character', label: 'Character' },
        { id: 'object', label: 'Object' },
        { id: 'scene', label: 'Scene/Background' },
        { id: 'style', label: 'Style Reference' },
    ];

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && images.length < 4) {
            Array.from(files).slice(0, 4 - images.length).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    setImages(prev => [...prev, {
                        id: Math.random().toString(36).substr(2, 9),
                        url: event.target?.result as string,
                        role: 'character'
                    }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };

    const updateRole = (id: string, role: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, role } : img));
    };

    const handleGenerate = async () => {
        if (images.length === 0 || !prompt.trim()) return;
        await createVideo(prompt, {
            duration: parseInt(duration),
            imageUrl: images[0].url,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 text-purple-500 mb-4">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-medium">Multi-Element Video</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Multi-Image to Video</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Combine up to 4 reference images into one cohesive video with character consistency
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Image Upload */}
                            <div className="tool-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium">Reference Images ({images.length}/4)</label>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {images.map((img) => (
                                        <div key={img.id} className="relative">
                                            <div className="aspect-square rounded-lg overflow-hidden">
                                                <img src={img.url} alt="Reference" className="w-full h-full object-cover" />
                                            </div>
                                            <button
                                                onClick={() => removeImage(img.id)}
                                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                            <Select value={img.role} onValueChange={(v) => updateRole(img.id, v)}>
                                                <SelectTrigger className="mt-2 h-8 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>{role.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}

                                    {images.length < 4 && (
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors">
                                                <div className="text-center">
                                                    <Plus className="w-8 h-8 mx-auto text-muted-foreground" />
                                                    <span className="text-xs text-muted-foreground">Add Image</span>
                                                </div>
                                            </div>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Interaction Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Interaction Prompt</label>
                                <Textarea
                                    placeholder="Describe how the elements should interact...&#10;&#10;Example:&#10;• The woman picks up the red bag&#10;• The character walks through the forest scene&#10;• Both characters shake hands"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    className="min-h-[120px] resize-none"
                                />
                            </div>

                            {/* Settings */}
                            <div className="tool-card p-4 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Duration</label>
                                        <Select value={duration} onValueChange={setDuration}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="5">5 seconds</SelectItem>
                                                <SelectItem value="10">10 seconds</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Quality</label>
                                        <Select value={quality} onValueChange={setQuality}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="std">Standard</SelectItem>
                                                <SelectItem value="pro">Professional</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            {/* Generate */}
                            <Button
                                onClick={handleGenerate}
                                disabled={images.length === 0 || !prompt.trim() || isGenerating}
                                className="w-full h-14 text-lg gradient-primary"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                        Creating Video...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5 mr-2" />
                                        Generate Multi-Element Video
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Preview */}
                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black/20 relative">
                                    {generatedVideo ? (
                                        <>
                                            <video
                                                src={generatedVideo}
                                                className="w-full h-full object-contain"
                                                loop
                                                autoPlay
                                                muted
                                                controls
                                            />
                                            <div className="absolute top-4 right-4">
                                                <Button size="sm" variant="secondary">
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="text-center">
                                                <Users className="w-20 h-20 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold mb-2">Multi-Subject Video</h3>
                                                <p className="text-muted-foreground max-w-md">
                                                    Upload multiple reference images and describe their interactions
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {isGenerating && (
                                        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="relative w-24 h-24 mx-auto mb-6">
                                                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" />
                                                    <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
                                                </div>
                                                <p className="text-xl font-semibold mb-2">Combining Elements</p>
                                                <p className="text-muted-foreground">Ensuring character consistency...</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reference Preview */}
                                {images.length > 0 && !generatedVideo && (
                                    <div className="mt-4">
                                        <p className="text-sm text-muted-foreground mb-2">Reference Elements:</p>
                                        <div className="flex gap-2">
                                            {images.map((img) => (
                                                <div key={img.id} className="relative">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                                                        <img src={img.url} alt="Reference" className="w-full h-full object-cover" />
                                                    </div>
                                                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs bg-background px-1 rounded">
                                                        {roles.find(r => r.id === img.role)?.label}
                                                    </span>
                                                </div>
                                            ))}
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

export default MultiImageVideo;
