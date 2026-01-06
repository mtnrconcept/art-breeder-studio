import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GenerateImageParams {
  prompt: string;
  baseImageUrl?: string;
  styleStrength?: number;
  faceStrength?: number;
  contentStrength?: number;
}

interface GenerationResult {
  imageUrl: string;
  creationId?: string;
}

export const useImageGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const generateImage = async (params: GenerateImageParams): Promise<GenerationResult | null> => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt: params.prompt,
          baseImageUrl: params.baseImageUrl,
          styleStrength: params.styleStrength ?? 50,
          faceStrength: params.faceStrength ?? 50,
          contentStrength: params.contentStrength ?? 50
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) {
        // Handle rate limiting
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          toast({
            variant: 'destructive',
            title: 'Rate limit exceeded',
            description: 'Please wait a moment before generating again.'
          });
        } else if (error.message?.includes('402')) {
          toast({
            variant: 'destructive',
            title: 'Credits exhausted',
            description: 'Please add more credits to continue generating.'
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Generation failed',
            description: error.message || 'An error occurred during image generation.'
          });
        }
        return null;
      }

      return {
        imageUrl: data.imageUrl,
        creationId: data.creationId
      };
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        variant: 'destructive',
        title: 'Generation failed',
        description: 'An unexpected error occurred.'
      });
      return null;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const varyImage = async (creationId: string, prompt: string): Promise<GenerationResult | null> => {
    return generateImage({ prompt: `variation of: ${prompt}` });
  };

  const enhanceImage = async (imageUrl: string): Promise<GenerationResult | null> => {
    return generateImage({ prompt: 'enhance and improve image quality', baseImageUrl: imageUrl });
  };

  return {
    generateImage,
    varyImage,
    enhanceImage,
    isGenerating,
    progress
  };
};
