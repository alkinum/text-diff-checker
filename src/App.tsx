
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OfflinePage from "./components/OfflinePage";
import OfflineIndicator from "./components/OfflineIndicator";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { register } from "./utils/serviceWorker";

const queryClient = new QueryClient();

// 错误边界组件
const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Application error occurred:', event.error);
      if (!isOnline) {
        setHasError(true);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (!isOnline && event.reason?.message?.includes('fetch')) {
        setHasError(true);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [isOnline]);

  // 当网络恢复时重置错误状态
  useEffect(() => {
    if (isOnline && hasError) {
      setHasError(false);
    }
  }, [isOnline, hasError]);

  if (hasError && !isOnline) {
    return <OfflinePage />;
  }

  return <>{children}</>;
};

const App = () => {
  const { toast } = useToast();

  useEffect(() => {
    // Service Worker callbacks with toast notifications
    const handleServiceWorkerUpdate = (registration: ServiceWorkerRegistration) => {
      console.log('Service Worker: Update available, showing notification');
      
      toast({
        title: "New Version Available! 🚀",
        description: "A new version of the app is ready. Reload to get the latest features and improvements.",
        duration: Infinity, // Keep it open until user takes action
        action: (
          <ToastAction 
            altText="Reload now"
            onClick={() => {
              console.log('Service Worker: User chose to reload for update');
              window.location.reload();
            }}
          >
            Reload Now
          </ToastAction>
        ),
      });
    };

    const handleServiceWorkerReady = () => {
      console.log('Service Worker: Ready, showing cached notification');
      
      toast({
        title: "App Ready for Offline Use! 💾",
        description: "The app has been cached and will work offline.",
        duration: 4000,
      });
    };

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SW_READY') {
        handleServiceWorkerReady();
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Register Service Worker with toast notifications
    register({
      onSuccess: handleServiceWorkerReady,
      onUpdate: handleServiceWorkerUpdate
    });

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [toast]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system">
        <TooltipProvider>
          <ErrorBoundary>
            <Toaster />
            <Sonner />
            <OfflineIndicator />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/offline" element={<OfflinePage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
