import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './globals.css';
import 'prism-themes/themes/prism-okaidia.css';
import { Inter, Sora } from 'next/font/google';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from "@/components/ui/toaster"
import { TooltipProvider } from '@/components/ui/tooltip';
import { NotesProvider } from '@/contexts/notes-context';
import { GamificationProvider } from '@/contexts/gamification-context';
import { TemplatesProvider } from '@/contexts/templates-context';
import { ConfettiCelebration } from '@/components/app/confetti-celebration';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const sora = Sora({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--font-headline' });

export const metadata: Metadata = {
  title: 'MemoWeave',
  description: 'Weave your thoughts into beautiful, organized notes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn('font-body antialiased', inter.variable, sora.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TemplatesProvider>
            <GamificationProvider>
              <NotesProvider>
                <TooltipProvider>
                  <ConfettiCelebration />
                  {children}
                </TooltipProvider>
                <Toaster />
              </NotesProvider>
            </GamificationProvider>
          </TemplatesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
