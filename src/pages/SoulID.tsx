import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Upload, UserCircle, Wand2, RefreshCw, Download, Plus, X, Save, Sparkles } from 'lucide-react';

const SoulID = () => {
    const [characterName, setCharacterName] = useState('');
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [savedCharacters, setSavedCharacters] = useState<{ name: string; images: string[] }[]>([
        { name: 'Emma', images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'] },
        { name: 'Alex', images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'] },
    ]);
    const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<string[]>([]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && referenceImages.length < 5) {
            Array.from(files).slice(0, 5 - referenceImages.length).forEach((file) => {
                const reader = new FileReader();
                reader.onload = (event) => setReferenceImages(prev => [...prev, event.target?.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (index: number) => setReferenceImages(prev => prev.filter((_, i) => i !== index));

    const handleSaveCharacter = () => {
        if (!characterName.trim() || referenceImages.length < 2) return;
        setSavedCharacters(prev => [...prev, { name: characterName, images: referenceImages }]);
        setCharacterName('');
        setReferenceImages([]);
    };

    const handleGenerate = () => {
        if ((referenceImages.length < 2 && !selectedCharacter) || !prompt.trim()) return;
        setIsProcessing(true);
        setTimeout(() => {
            setResults([
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=500&fit=crop',
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop',
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop',
            ]);
            setIsProcessing(false);
        }, 4000);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-500 mb-4">
                            <UserCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Character Consistency</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4"><span className="gradient-text">Soul ID</span></h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Maintain perfect character consistency across all your generations</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="space-y-4">
                            {/* Saved Characters */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Saved Characters</label>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {savedCharacters.map((char, i) => (
                                        <button key={i} onClick={() => { setSelectedCharacter(char.name); setReferenceImages(char.images); }}
                                            className={`p-2 rounded-lg border text-center transition-all ${selectedCharacter === char.name ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}>
                                            <div className="w-10 h-10 rounded-full overflow-hidden mx-auto mb-1"><img src={char.images[0]} className="w-full h-full object-cover" /></div>
                                            <span className="text-xs">{char.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Create New */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Create New Character</label>
                                <Input placeholder="Character name" value={characterName} onChange={(e) => setCharacterName(e.target.value)} className="mb-3" />

                                <p className="text-xs text-muted-foreground mb-2">Upload 2-5 reference images</p>
                                <div className="grid grid-cols-5 gap-2">
                                    {referenceImages.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                                            <img src={img} className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="w-2 h-2" /></button>
                                        </div>
                                    ))}
                                    {referenceImages.length < 5 && (
                                        <label className="cursor-pointer">
                                            <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                                            <div className="aspect-square border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary transition-colors"><Plus className="w-4 h-4 text-muted-foreground" /></div>
                                        </label>
                                    )}
                                </div>

                                {characterName.trim() && referenceImages.length >= 2 && (
                                    <Button onClick={handleSaveCharacter} variant="outline" className="w-full mt-3"><Save className="w-4 h-4 mr-2" />Save Character</Button>
                                )}
                            </div>

                            {/* Generation Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Scene Prompt</label>
                                <Textarea placeholder="Describe the scene...&#10;&#10;Examples:&#10;• Standing in a coffee shop, smiling&#10;• Walking on a beach at sunset&#10;• Professional headshot with dark background" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[120px] resize-none" />
                            </div>

                            <Button onClick={handleGenerate} disabled={(referenceImages.length < 2 && !selectedCharacter) || !prompt.trim() || isProcessing} className="w-full h-14 text-lg gradient-primary">
                                {isProcessing ? <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-5 h-5 mr-2" />Generate with Soul ID</>}
                            </Button>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="tool-card p-6">
                                <h3 className="font-medium mb-4">Generated Images</h3>
                                {results.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-4">
                                        {results.map((img, i) => (
                                            <div key={i} className="relative group aspect-[3/4] rounded-lg overflow-hidden">
                                                <img src={img} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button size="sm" variant="secondary"><Download className="w-4 h-4" /></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-xl bg-gradient-to-br from-blue-900/20 to-indigo-600/20 flex items-center justify-center">
                                        <div className="text-center"><UserCircle className="w-20 h-20 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Soul ID Generation</h3><p className="text-muted-foreground">Your consistent character images will appear here</p></div>
                                    </div>
                                )}
                                {isProcessing && (
                                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                        <div className="text-center"><div className="relative w-24 h-24 mx-auto mb-6"><div className="absolute inset-0 rounded-full border-4 border-blue-500/20" /><div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div><p className="text-xl font-semibold">Generating with character consistency...</p></div>
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

export default SoulID;
