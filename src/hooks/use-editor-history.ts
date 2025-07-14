

'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Note } from '@/lib/types';

export type EditorState = Omit<Note, 'id' | 'isPinned' | 'isArchived' | 'isTrashed' | 'createdAt' | 'updatedAt' | 'history' | 'isDraft' | 'order' | 'planId' | 'planGoal' | 'userId'>;

export const areStatesEqual = (a: EditorState, b: EditorState) => {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch (e) {
        return false;
    }
};

export const useEditorHistory = (initialState: EditorState) => {
    const [history, setHistory] = useState<EditorState[]>([initialState]);
    const [index, setIndex] = useState(0);

    const state = history[index];
    const getInitialState = useCallback(() => history[0], [history]);

    const setState = useCallback((newState: EditorState | ((prevState: EditorState) => EditorState)) => {
        const resolvedState = typeof newState === 'function' ? newState(state) : newState;
        
        const newHistory = history.slice(0, index + 1);
        newHistory.push(resolvedState);
        setHistory(newHistory);
        setIndex(newHistory.length - 1);

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

    return {
        state,
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory,
        getInitialState,
    };
};
