import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Edit3, Wand2, RefreshCw, Download, Plus, Minus, Sun, Moon, Smile, Frown } from 'lucide-react';

const editModels = [
    { id: 'nano-banana', label: 'Nano Banana', description: 'Fast & precise' },
    { id: 'flux-kontext', label: 'Flux Kontext', description: 'High quality' },
    { id: 'qwen', label: 'Qwen Edit', description: 'Best understanding' },
    { id: 'sdxl-inpaint', label: 'SDXL Inpaint', description: 'Creative' },
];

const quickActions = [
    { id: 'add-object', icon: Plus, label: 'Add Object' },
    { id: 'remove-object', icon: Minus, label: 'Remove Object' },
    { id: 'brighten', icon: Sun, label: 'Brighten' },
    { id: 'darken', icon: Moon, label: 'Darken' },
    { id: 'happier', icon: Smile, label: 'Make Happier' },
    { id: 'sadder', icon: Frown, label: 'Make Sadder' },
];

const GenerativeEdit = () => {
    const [image, setImage] = useState<string | null>(null);
    const [editPrompt, setEditPrompt] = useState('');
    const [selectedModel, setSelectedModel] = useState('nano-banana');
    const [result, setResult] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [history, setHistory] = useState<string[]>([]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newImage = event.target?.result as string;
                setImage(newImage);
                setResult(null);
                setHistory([]);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleQuickAction = (actionId: string) => {
        const action = quickActions.find(a => a.id === actionId);
        if (action) {
            setEditPrompt(prev => {
                if (prev) return `${prev}, ${action.label.toLowerCase()}`;
                return action.label;
            });
        }
    };

    const handleEdit = () => {
        if (!image || !editPrompt.trim()) return;
        setIsProcessing(true);

        setTimeout(() => {
            const newResult = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop';
            setResult(newResult);
            setHistory(prev => [...prev, image!]);
            setIsProcessing(false);
        }, 2500);
    };

    const handleUndo = () => {
        if (history.length > 0) {
            const prevImage = history[history.length - 1];
            setHistory(prev => prev.slice(0, -1));
            setImage(prevImage);
            setResult(null);
        }
    };

    const handleApplyResult = () => {
        if (result) {
            setHistory(prev => [...prev, image!]);
            setImage(result);
            setResult(null);
            setEditPrompt('');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 text-orange-500 mb-4">
                            <Edit3 className="w-4 h-4" />
                            <span className="text-sm font-medium">Generative AI</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="gradient-text">Generative Edit</span>
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Edit images with natural language - add, remove, or modify anything
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Controls */}
                        <div className="space-y-4">
                            {/* Upload */}
                            <div className="tool-card p-4">
                                <label className="block">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors">
                                        <Upload className="w-5 h-5" />
                                        <span>{image ? 'Change Image' : 'Upload Image'}</span>
                                    </div>
                                </label>
                            </div>

                            {/* Quick Actions */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Quick Actions</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {quickActions.map((action) => {
                                        const Icon = action.icon;
                                        return (
                                            <button
                                                key={action.id}
                                                onClick={() => handleQuickAction(action.id)}
                                                className="p-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all text-sm flex items-center gap-2"
                                            >
                                                <Icon className="w-4 h-4" />
                                                {action.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Edit Prompt */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Edit Instructions</label>
                                <Textarea
                                    placeholder="Describe what you want to change...&#10;&#10;Examples:&#10;• Add a red hat&#10;• Remove the person in the background&#10;• Change the sky to sunset&#10;• Make her smile"
                                    value={editPrompt}
                                    onChange={(e) => setEditPrompt(e.target.value)}
                                    className="min-h-[150px] resize-none"
                                />
                            </div>

                            {/* Model */}
                            <div className="tool-card p-4">
                                <label className="block text-sm font-medium mb-3">Edit Model</label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {editModels.map((model) => (
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

                            {/* Actions */}
                            <div className="space-y-2">
                                <Button
                                    onClick={handleEdit}
                                    disabled={!image || !editPrompt.trim() || isProcessing}
                                    className="w-full h-12 gradient-primary"
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            Apply Edit
                                        </>
                                    )}
                                </Button>

                                {history.length > 0 && (
                                    <Button variant="outline" onClick={handleUndo} className="w-full">
                                        Undo ({history.length})
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* Preview Area */}
                        <div className="lg:col-span-3">
                            <div className="tool-card p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Original */}
                                    <div>
                                        <h3 className="font-medium mb-3">Current Image</h3>
                                        <div className="aspect-square rounded-lg overflow-hidden bg-muted/30">
                                            {image ? (
                                                <img src={image} alt="Current" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">Upload an image</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Result */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium">Edited Result</h3>
                                            {result && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" onClick={handleApplyResult}>
                                                        Apply
                                                    </Button>
                                                    <Button size="sm" variant="outline">
                                                        <Download className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <div className="aspect-square rounded-lg overflow-hidden bg-muted/30 relative">
                                            {result ? (
                                                <img src={result} alt="Result" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <div className="text-center">
                                                        <Wand2 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                                                        <p className="text-sm text-muted-foreground">Result will appear here</p>
                                                    </div>
                                                </div>
                                            )}

                                            {isProcessing && (
                                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                                                    <div className="text-center">
                                                        <div className="relative w-16 h-16 mx-auto mb-3">
                                                            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                                                            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                                        </div>
                                                        <p className="text-sm font-medium">Editing image...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Edit History */}
                                {history.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h4 className="text-sm font-medium mb-3">Edit History</h4>
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {history.map((historyImg, index) => (
                                                <div
                                                    key={index}
                                                    className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-border"
                                                >
                                                    <img src={historyImg} alt={`History ${index + 1}`} className="w-full h-full object-cover" />
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

export default GenerativeEdit;
