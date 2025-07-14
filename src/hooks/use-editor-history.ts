
'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Note } from '@/lib/types';

export type EditorState = Omit<Note, 'id' | 'isPinned' | 'isArchived' | 'isTrashed' | 'createdAt' | 'updatedAt' | 'history' | 'isDraft' | 'order' | 'planId' | 'planGoal' | 'userId'>;

const areStatesEqual = (a: EditorState, b: EditorState) => {
    return JSON.stringify(a) === JSON.stringify(b);
};

export const useEditorHistory = (initialState: EditorState) => {
    const [history, setHistory] = useState<EditorState[]>([initialState]);
    const [index, setIndex] = useState(0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const state = useMemo(() => history[index] || initialState, [history, index, initialState]);
    const isDirty = useMemo(() => !areStatesEqual(history[0], history[index]), [history, index]);

    const setState = useCallback((newState: EditorState | ((prevState: EditorState) => EditorState)) => {
        const resolvedState = typeof newState === 'function' ? newState(state) : newState;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set the state immediately for responsiveness without creating a new history entry yet
        setHistory(currentHistory => {
            const newHistory = [...currentHistory];
            newHistory[index] = resolvedState;
            return newHistory;
        });

        debounceTimer.current = setTimeout(() => {
            setHistory(currentHistory => {
                // Only commit to history if the state has actually changed from the last real history entry
                 if (!areStatesEqual(currentHistory[index], resolvedState)) {
                    const truncatedHistory = currentHistory.slice(0, index + 1);
                    const finalHistory = [...truncatedHistory, resolvedState];
                    setIndex(finalHistory.length - 1);
                    return finalHistory;
                }
                return currentHistory;
            });
        }, 500); // 500ms debounce
    }, [index, state]);


    const undo = useCallback(() => {
        if (index > 0) {
            setIndex(prevIndex => prevIndex - 1);
        }
    }, [index]);

    const redo = useCallback(() => {
        if (index < history.length - 1) {
            setIndex(prevIndex => prevIndex + 1);
        }
    }, [index, history.length]);

    const resetHistory = useCallback((newState: EditorState) => {
        setHistory([newState]);
        setIndex(0);
    }, []);

    const canUndo = index > 0;
    const canRedo = index < history.length - 1;

    useEffect(() => {
        // Cleanup timer on unmount
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    return {
        state,
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory,
        isDirty
    };
};
