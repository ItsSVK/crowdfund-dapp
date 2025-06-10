'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Construction, Github } from 'lucide-react';

export function DevelopmentNotice() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the notice in this session
    const hasSeenNotice = sessionStorage.getItem('dev-notice-seen');

    if (!hasSeenNotice) {
      // Show modal after a brief delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Remember that user has seen the notice in this session
    sessionStorage.setItem('dev-notice-seen', 'true');
  };

  const handleDontShowAgain = () => {
    setIsOpen(false);
    // Remember across sessions (until browser data is cleared)
    localStorage.setItem('dev-notice-dismissed', 'true');
    sessionStorage.setItem('dev-notice-seen', 'true');
  };

  // Check if user has permanently dismissed the notice
  useEffect(() => {
    const isPermanentlyDismissed = localStorage.getItem('dev-notice-dismissed');
    if (isPermanentlyDismissed) {
      setIsOpen(false);
    }
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Construction className="h-5 w-5 text-amber-500" />
            <DialogTitle className="text-lg font-semibold">
              Development Preview
            </DialogTitle>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Beta
            </Badge>
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Welcome to CrowdFund Solana! 🚀
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 leading-relaxed">
              This application is currently under{' '}
              <strong>active development</strong>. Features may change, and you
              might encounter bugs or incomplete functionality.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">What&apos;s working:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Campaign creation and viewing</li>
              <li>• SOL contributions to campaigns</li>
              <li>• Three-way withdrawal system</li>
              <li>• PWA installation support</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Coming soon:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Enhanced campaign analytics</li>
              <li>• Social features & sharing</li>
              <li>• Campaign categories & search</li>
              <li>• Mobile app optimizations</li>
              <li>• Deployment on Solana mainnet</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Github className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <p className="text-xs text-blue-800">
                  This project will be open-source in the future.
                </p>
              </div>
              {/* <ExternalLink className="h-3 w-3 text-blue-600" /> */}
            </div>

            <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
              <svg
                className="h-4 w-4 text-purple-600"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs text-purple-800">
                  <strong>Got feedback?</strong> Tag me on Twitter{' '}
                  <a
                    href="https://twitter.com/ShouvikMohanta"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline hover:no-underline"
                  >
                    @ShouvikMohanta
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleClose} className="w-full">
            Got it, let&apos;s explore!
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDontShowAgain}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Don&apos;t show this again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DevelopmentNotice;
