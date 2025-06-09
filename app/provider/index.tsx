import { ThemeProvider } from '@/components/theme-provider';
import { WalletContextProvider } from '@/components/wallet-context-provider';
import { Toaster } from '@/components/ui/sonner';

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </WalletContextProvider>
  );
}
