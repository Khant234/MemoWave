
"use client";

import * as React from 'react';
import { Plus, Mic, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useClickSound } from '@/hooks/use-click-sound';

type MobileFabProps = {
  onNewNote: () => void;
  onNewVoiceNote: () => void;
};

export function MobileFab({ onNewNote, onNewVoiceNote }: MobileFabProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const playClickSound = useClickSound();

  // Close menu if user clicks outside of it
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // a bit of a hacky way to check if the click is outside
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('[data-fab-menu]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleFabClick = () => {
    playClickSound();
    setIsOpen(!isOpen);
  };

  const handleNewNoteClick = () => {
    playClickSound();
    onNewNote();
    setIsOpen(false);
  };

  const handleNewVoiceNoteClick = () => {
    playClickSound();
    onNewVoiceNote();
    setIsOpen(false);
  };


  return (
    <div className="fixed bottom-6 right-6 z-40 sm:hidden" data-fab-menu>
      <div className="relative flex flex-col items-center gap-3">
        {/* Expanded options */}
        <div
          className={cn(
            'flex flex-col-reverse items-center gap-3 transition-all duration-200 ease-in-out',
            isOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4 pointer-events-none'
          )}
        >
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full w-14 h-14 shadow-md"
            aria-label="New Voice Note"
            onClick={handleNewVoiceNoteClick}
          >
            <Mic className="h-6 w-6" />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="rounded-full w-14 h-14 shadow-md"
            aria-label="New Note"
            onClick={handleNewNoteClick}
          >
            <Pencil className="h-6 w-6" />
          </Button>
        </div>

        {/* Main FAB button */}
        <Button
          size="lg"
          className={cn(
            'rounded-full w-16 h-16 shadow-lg transition-transform duration-200 ease-in-out',
            isOpen && 'rotate-45'
          )}
          onClick={handleFabClick}
          aria-expanded={isOpen}
        >
          <Plus className="h-8 w-8" />
          <span className="sr-only">Create new note</span>
        </Button>
      </div>
    </div>
  );
}
