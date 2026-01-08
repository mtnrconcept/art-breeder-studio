import React from 'react';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Square, Layout, SquareIcon } from 'lucide-react';

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3' | '3:2' | 'custom';

interface AspectRatioSelectorProps {
    value: AspectRatio;
    onChange: (value: AspectRatio) => void;
    customDimensions?: { width: number; height: number };
}

const ratios: { id: AspectRatio; label: string; icon: any }[] = [
    { id: '1:1', label: '1:1', icon: Square },
    { id: '16:9', label: '16:9', icon: Monitor },
    { id: '9:16', label: '9:16', icon: Smartphone },
    { id: '4:3', label: '4:3', icon: Layout },
    { id: '3:4', label: '3:4', icon: Smartphone },
    { id: '2:3', label: '2:3', icon: Smartphone },
    { id: '3:2', label: '3:2', icon: Monitor },
];

export const AspectRatioSelector: React.FC<AspectRatioSelectorProps> = ({ value, onChange, customDimensions }) => {
    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-muted-foreground">Aspect Ratio</label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {ratios.map((ratio) => {
                    const Icon = ratio.icon;
                    return (
                        <button
                            key={ratio.id}
                            onClick={() => onChange(ratio.id)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${value === ratio.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
                                }`}
                            title={ratio.label}
                        >
                            <Icon className="w-4 h-4 mb-1" />
                            <span className="text-[10px] font-medium">{ratio.label}</span>
                        </button>
                    );
                })}
            </div>
            {customDimensions && value === 'custom' && (
                <div className="text-xs text-muted-foreground mt-1">
                    Detected: {customDimensions.width} x {customDimensions.height}
                </div>
            )}
        </div>
    );
};
