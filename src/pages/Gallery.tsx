import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Image, 
  Trash2, 
  Download, 
  Eye, 
  Plus,
  Loader2,
  Calendar,
  Sparkles
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Creation {
  id: string;
  title: string | null;
  prompt: string;
  image_url: string;
  created_at: string;
  is_public: boolean;
}

const Gallery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [creations, setCreations] = useState<Creation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreation, setSelectedCreation] = useState<Creation | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCreations();
  }, [user, navigate]);

  const fetchCreations = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('creations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error loading gallery',
        description: error.message
      });
    } else {
      setCreations(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('creations')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message
      });
    } else {
      setCreations(creations.filter(c => c.id !== id));
      toast({
        title: 'Deleted',
        description: 'Creation removed from your gallery.'
      });
    }
  };

  const handleDownload = (creation: Creation) => {
    const link = document.createElement('a');
    link.href = creation.image_url;
    link.download = `artbreeder-${creation.id}.png`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold gradient-text">My Gallery</h1>
              <p className="text-muted-foreground mt-1">
                {creations.length} creation{creations.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Button className="gradient-primary" asChild>
              <Link to="/composer">
                <Plus className="mr-2 h-4 w-4" />
                Create New
              </Link>
            </Button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : creations.length === 0 ? (
            <Card className="glass p-12 text-center">
              <Image className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No creations yet</h2>
              <p className="text-muted-foreground mb-6">
                Start creating amazing AI art with our Composer tool.
              </p>
              <Button className="gradient-primary" asChild>
                <Link to="/composer">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start Creating
                </Link>
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {creations.map((creation) => (
                <Card key={creation.id} className="glass group overflow-hidden">
                  <div className="aspect-square relative">
                    <img 
                      src={creation.image_url} 
                      alt={creation.title || creation.prompt}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Button 
                            variant="secondary" 
                            size="icon"
                            onClick={() => setSelectedCreation(creation)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon"
                            onClick={() => handleDownload(creation)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete creation?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your creation.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(creation.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-foreground truncate">
                      {creation.title || creation.prompt}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(creation.created_at)}
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
          <div 
            className="max-w-4xl max-h-[90vh] overflow-hidden rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={selectedCreation.image_url} 
              alt={selectedCreation.title || selectedCreation.prompt}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
