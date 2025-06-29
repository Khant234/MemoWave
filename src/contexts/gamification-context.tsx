'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { type Note } from '@/lib/types';
import { AchievementToast } from '@/components/app/achievement-toast';

// --- Achievement Definitions ---
const achievements = {
  FIRST_STEPS: { title: 'First Steps', description: 'You completed your first task!', tasksRequired: 1 },
  TASK_NOVICE: { title: 'Task Novice', description: '10 tasks completed. Keep it up!', tasksRequired: 10 },
  TASK_APPRENTICE: { title: 'Task Apprentice', description: '25 tasks down. You\'re getting good at this!', tasksRequired: 25 },
  TASK_MASTER: { title: 'Task Master', description: '50 tasks crushed. Incredible!', tasksRequired: 50 },
  PERFECT_LIST: { title: 'List Annihilator', description: 'You cleared a whole checklist!' },
};

type AchievementKey = keyof typeof achievements;

// --- Context Definition ---
type GamificationContextType = {
  recordTaskCompletion: (note: Note, toggledItemId: string) => void;
  isCelebrating: boolean;
  celebrationComplete: () => void;
};

const GamificationContext = React.createContext<GamificationContextType | undefined>(undefined);

// --- Local Storage Keys ---
const COMPLETED_TASKS_KEY = 'gamification_completedTasksCount';
const UNLOCKED_ACHIEVEMENTS_KEY = 'gamification_unlockedAchievements';


// --- Provider Component ---
export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [completedTasksCount, setCompletedTasksCount] = React.useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = React.useState<Set<AchievementKey>>(new Set());
  const [isCelebrating, setIsCelebrating] = React.useState(false);

  // Load initial state from localStorage
  React.useEffect(() => {
    try {
      const storedCount = localStorage.getItem(COMPLETED_TASKS_KEY);
      if (storedCount) setCompletedTasksCount(parseInt(storedCount, 10));

      const storedAchievements = localStorage.getItem(UNLOCKED_ACHIEVEMENTS_KEY);
      if (storedAchievements) setUnlockedAchievements(new Set(JSON.parse(storedAchievements)));
    } catch (error) {
      console.error("Failed to load gamification data from localStorage", error);
    }
  }, []);

  // Persist state to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem(COMPLETED_TASKS_KEY, completedTasksCount.toString());
      localStorage.setItem(UNLOCKED_ACHIEVEMENTS_KEY, JSON.stringify(Array.from(unlockedAchievements)));
    } catch (error) {
      console.error("Failed to save gamification data to localStorage", error);
    }
  }, [completedTasksCount, unlockedAchievements]);


  const triggerAchievement = React.useCallback((key: AchievementKey) => {
    if (!unlockedAchievements.has(key)) {
      const achievement = achievements[key];
      toast({
        description: <AchievementToast title={achievement.title} description={achievement.description} />,
        duration: 5000,
      });
      setUnlockedAchievements(prev => new Set(prev).add(key));
    }
  }, [toast, unlockedAchievements]);

  const recordTaskCompletion = React.useCallback((oldNote: Note, toggledItemId: string) => {
      const wasIncomplete = !oldNote.checklist.find(item => item.id === toggledItemId)?.completed;
    
      if (!wasIncomplete) {
        return;
      }
      
      const newCount = completedTasksCount + 1;
      setCompletedTasksCount(newCount);
      setIsCelebrating(true); // Trigger confetti!

      // Check for count-based achievements
      Object.entries(achievements).forEach(([key, achievement]) => {
        if ('tasksRequired' in achievement && newCount >= achievement.tasksRequired) {
          triggerAchievement(key as AchievementKey);
        }
      });
      
      // Check if the entire list is now complete
      const isListComplete = oldNote.checklist.every(item => 
        item.id === toggledItemId ? true : item.completed
      );

      if (isListComplete) {
        triggerAchievement('PERFECT_LIST');
      }

  }, [completedTasksCount, triggerAchievement]);

  const celebrationComplete = () => {
    setIsCelebrating(false);
  }

  return (
    <GamificationContext.Provider value={{ recordTaskCompletion, isCelebrating, celebrationComplete }}>
      {children}
    </GamificationContext.Provider>
  );
}

// --- Hook to use the context ---
export function useGamification() {
  const context = React.useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
