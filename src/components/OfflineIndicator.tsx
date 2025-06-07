import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEffect, useState } from "react";

const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    } else {
      // 延迟隐藏在线状态提示
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showOfflineAlert) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert className={`shadow-lg backdrop-blur-sm ${
        isOnline 
          ? 'bg-green-50/90 border-green-200 text-green-800 dark:bg-green-950/90 dark:border-green-800 dark:text-green-200' 
          : 'bg-orange-50/90 border-orange-200 text-orange-800 dark:bg-orange-950/90 dark:border-orange-800 dark:text-orange-200'
      }`}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertDescription className="font-medium">
          {isOnline ? 'Connection restored' : 'You are currently offline'}
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default OfflineIndicator; 