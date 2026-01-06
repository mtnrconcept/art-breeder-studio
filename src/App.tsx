import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tools from "./pages/Tools";
import Composer from "./pages/Composer";
import Splicer from "./pages/Splicer";
import Portraits from "./pages/Portraits";
import Patterns from "./pages/Patterns";
import Outpainter from "./pages/Outpainter";
import Tuner from "./pages/Tuner";
import Gallery from "./pages/Gallery";
import Explore from "./pages/Explore";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/composer" element={<Composer />} />
            <Route path="/splicer" element={<Splicer />} />
            <Route path="/portraits" element={<Portraits />} />
            <Route path="/patterns" element={<Patterns />} />
            <Route path="/outpainter" element={<Outpainter />} />
            <Route path="/tuner" element={<Tuner />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
