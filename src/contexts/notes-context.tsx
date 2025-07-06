'use client';

import * as React from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { type Note } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type NotesContextType = {
  notes: Note[];
  isLoading: boolean;
};

const NotesContext = React.createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const notesCollectionRef = collection(db, "notes");
    const q = query(notesCollectionRef, orderBy("updatedAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedNotes = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id } as Note;
        });
        setNotes(fetchedNotes);
        setIsLoading(false);
      },
      (error) => {
        console.error("Failed to subscribe to notes from Firestore", error);
        toast({
          title: "Error fetching data",
          description: "Could not load data in real-time. Please check your Firebase configuration and internet connection.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  return (
    <NotesContext.Provider value={{ notes, isLoading }}>
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = React.useContext(NotesContext);
  if (context === undefined) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
