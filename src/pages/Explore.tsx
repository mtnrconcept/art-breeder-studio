import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Loader2, 
  Eye,
  Heart,
  Sparkles
} from 'lucide-react';

interface Creation {
  id: string;
  title: string | null;
  prompt: string;
  image_url: string;
  created_at: string;
  user_id: string;
}

const Explore = () => {
  const { toast } = useToast();
  
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);

  useEffect(() => {
    fetchPublicCreations();
  }, []);

  const fetchPublicCreations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('creations')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading creations',
        description: error.message
      });
    } else {
      setCreations(data || []);
    }
    setLoading(false);
  };

  const filteredCreations = creations.filter(creation => 
    creation.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creation.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold gradient-text mb-4">Explore</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover amazing AI-generated artwork from the community
            </p>
          </div>

          {/* Search */}
          <div className="max-w-xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search creations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 bg-input border-border"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredCreations.length === 0 ? (
            <div className="text-center py-20">
              <Sparkles className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No public creations yet</h2>
              <p className="text-muted-foreground">
                Be the first to share your artwork with the community!
              </p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {filteredCreations.map((creation) => (
                <Card 
                  key={creation.id} 
                  className="glass group overflow-hidden break-inside-avoid cursor-pointer"
                  onClick={() => setSelectedCreation(creation)}
                >
                  <div className="relative">
                    <img 
                      src={creation.image_url} 
                      alt={creation.title || creation.prompt}
                      className="w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <p className="text-sm text-foreground line-clamp-2">
                          {creation.title || creation.prompt}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* View Modal */}
      {selectedCreation && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCreation(null)}
        >
          <Card 
            className="glass max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedCreation.image_url} 
              alt={selectedCreation.title || selectedCreation.prompt}
              className="max-w-full max-h-[70vh] object-contain"
            />
            <div className="p-6">
              <p className="text-foreground">{selectedCreation.prompt}</p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Explore;
