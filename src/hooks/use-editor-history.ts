

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

    const state = history[index];
    const isDirty = useMemo(() => !areStatesEqual(history[0], history[index]), [history, index]);

    const setState = useCallback((newState: EditorState | ((prevState: EditorState) => EditorState)) => {
        const resolvedState = typeof newState === 'function' ? newState(state) : newState;
        
        if(areStatesEqual(state, resolvedState)) return;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        debounceTimer.current = setTimeout(() => {
            const newHistory = history.slice(0, index + 1);
            setHistory([...newHistory, resolvedState]);
            setIndex(newHistory.length);
        }, 500); // 500ms debounce

        // Set the state immediately for responsiveness without creating a new history entry yet
        const immediateHistory = [...history];
        immediateHistory[index] = resolvedState;
        setHistory(immediateHistory);
    }, [index, state, history]);


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
