
'use client';

import { useCallback } from 'react';
import { useIsMobile } from './use-mobile';
import { playClickSound as playSound } from '@/lib/audio';

export const useClickSound = () => {
  const isMobile = useIsMobile();

  const playClickSound = useCallback(() => {
    if (isMobile) {
      playSound();
    }
  }, [isMobile]);

  return playClickSound;
};
