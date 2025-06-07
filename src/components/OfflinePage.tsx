import { WifiOff, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const OfflinePage = () => {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-background/95 dark:from-background dark:to-background/95 p-4">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 flex items-center justify-center rounded-full bg-muted">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold">You're Offline</CardTitle>
          <CardDescription className="text-base">
            Sorry, you're currently offline. Please check your internet connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>• Check your internet connection</p>
            <p>• Make sure you're connected to the internet</p>
            <p>• Refresh the page to try again</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleRefresh} 
              className="flex-1 gap-2"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
            <Button 
              onClick={handleGoHome} 
              variant="outline" 
              className="flex-1 gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflinePage; 