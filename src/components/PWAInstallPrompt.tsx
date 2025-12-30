import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasPromptBeenDismissed = localStorage.getItem('pwa-install-dismissed');
    
    if (isStandalone || hasPromptBeenDismissed === 'true') {
      return;
    }

    // Handle beforeinstallprompt event for Chrome/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after 30 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS devices, show install instructions after 30 seconds
    if (ios && !isStandalone) {
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">Install AllyNet</h3>
              
              {isIOS ? (
                <p className="text-xs text-muted-foreground mb-3">
                  To install: Tap the <strong>Share</strong> button, then tap <strong>Add to Home Screen</strong>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mb-3">
                  Install AllyNet for quick access and offline support
                </p>
              )}
              
              <div className="flex gap-2">
                {!isIOS && deferredPrompt && (
                  <Button 
                    onClick={handleInstallClick}
                    size="sm"
                    className="text-xs h-8"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Install
                  </Button>
                )}
                <Button 
                  onClick={handleDismiss}
                  variant="ghost"
                  size="sm"
                  className="text-xs h-8"
                >
                  Not Now
                </Button>
              </div>
            </div>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
