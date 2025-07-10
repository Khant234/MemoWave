
'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Note } from '@/lib/types';
import { useHotkeys } from 'react-hotkeys-hook';

export type EditorState = Omit<Note, 'id' | 'isPinned' | 'isArchived' | 'isTrashed' | 'createdAt' | 'updatedAt' | 'history' | 'isDraft' | 'order' | 'planId' | 'planGoal'>;

const areStatesEqual = (a: EditorState, b: EditorState) => {
    return JSON.stringify(a) === JSON.stringify(b);
};

export const useEditorHistory = (initialState: EditorState) => {
    const [history, setHistory] = useState<EditorState[]>([initialState]);
    const [index, setIndex] = useState(0);
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    const state = useMemo(() => history[index], [history, index]);
    const isDirty = useMemo(() => !areStatesEqual(history[0], history[index]), [history, index]);

    const setState = useCallback((newState: EditorState | ((prevState: EditorState) => EditorState)) => {
        const resolvedState = typeof newState === 'function' ? newState(state) : newState;
        
        // Update the current state immediately for responsiveness
        const newHistory = [...history];
        newHistory[index] = resolvedState;
        setHistory(newHistory);

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            // Check if the new state is actually different from the last saved state in history
            if (index > 0 && areStatesEqual(history[index - 1], resolvedState)) {
                 // If it's the same as the previous, we don't need a new entry, just update current
            } else if (!areStatesEqual(history[index], resolvedState)) {
                 // If different, create a new history entry
                 const truncatedHistory = history.slice(0, index + 1);
                 const finalHistory = [...truncatedHistory, resolvedState];
                 setHistory(finalHistory);
                 setIndex(finalHistory.length - 1);
            }
        }, 500); // 500ms debounce
    }, [history, index, state]);


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
