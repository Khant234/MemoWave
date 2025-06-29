'use client';

import * as React from 'react';
import Confetti from 'react-confetti';
import { useGamification } from '@/contexts/gamification-context';

export function ConfettiCelebration() {
  const { isCelebrating, celebrationComplete } = useGamification();
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const handleResize = () => {
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }
    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isCelebrating) {
    return null;
  }

  return (
    <Confetti
      width={windowSize.width}
      height={windowSize.height}
      recycle={false}
      numberOfPieces={200}
      onConfettiComplete={() => {
        if(celebrationComplete) celebrationComplete()
      }}
      className='!z-[200]'
    />
  );
}
