
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

    const state = useMemo(() => history[index], [history, index]);
    const isDirty = useMemo(() => !areStatesEqual(history[0], history[index]), [history, index]);

    const setState = useCallback((newState: EditorState | ((prevState: EditorState) => EditorState)) => {
        const resolvedState = typeof newState === 'function' ? newState(state) : newState;

        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        // Set the state immediately without creating a new history entry yet
        const currentHistory = [...history];
        currentHistory[index] = resolvedState;
        setHistory(currentHistory);

        debounceTimer.current = setTimeout(() => {
            // Now, commit to history if the state has actually changed from the last commit
            if (!areStatesEqual(history[index], resolvedState)) {
                const truncatedHistory = history.slice(0, index + 1);
                const finalHistory = [...truncatedHistory, resolvedState];
                setHistory(finalHistory);
                setIndex(finalHistory.length - 1);
            }
        }, 300); // 300ms debounce
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

    // This is the key change. We are now directly setting state in a stable way.
    const stableSetState = (newState: EditorState | ((prevState: EditorState) => EditorState)) => {
        setHistory(currentHistory => {
            const currentState = currentHistory[index];
            const resolvedState = typeof newState === 'function' ? newState(currentState) : newState;
            
            if (areStatesEqual(currentState, resolvedState)) {
                return currentHistory;
            }

            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            const nextHistory = [...currentHistory];
            nextHistory[index] = resolvedState;

            debounceTimer.current = setTimeout(() => {
                setHistory(prevHistory => {
                    const truncatedHistory = prevHistory.slice(0, index + 1);
                    return [...truncatedHistory, resolvedState];
                });
                setIndex(index + 1);
            }, 500);

            return nextHistory;
        });
    };

    return {
        state,
        setState: stableSetState,
        undo,
        redo,
        canUndo,
        canRedo,
        resetHistory,
        isDirty
    };
};
