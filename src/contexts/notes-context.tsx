
'use client';

import * as React from 'react';
import {
  collection,
  query,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { type Note } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './auth-context';

type NotesContextType = {
  notes: Note[];
  isLoading: boolean;
};

const NotesContext = React.createContext<NotesContextType | undefined>(undefined);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) {
      setNotes([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const db = getDb();
    if (!db) {
        setIsLoading(false);
        return;
    }

    const notesCollectionRef = collection(db, "notes");
    // The orderBy clause was removed from the query to prevent the missing index error.
    // The sorting is now handled on the client-side after the data is fetched.
    const q = query(
      notesCollectionRef, 
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedNotes = querySnapshot.docs.map((doc) => {
          return { ...doc.data(), id: doc.id } as Note;
        });
        
        // Sort notes on the client side
        fetchedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        
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
  }, [user, toast]);

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
