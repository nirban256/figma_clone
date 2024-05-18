import React, { useCallback, useEffect, useState } from 'react'
import LiveCursors from './cursor/LiveCursors'
import { useMyPresence, useOthers } from '@/liveblocks.config'
import { CursorMode, CursorState, Reaction } from '@/types/type';
import CursorChat from './cursor/CursorChat';
import ReactionSelector from './reaction/ReactionButton';

const Live = () => {
    const others = useOthers();
    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const [reaction, setReaction] = useState<Reaction[]>([]);

    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    });

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();
        // subtract the target's position from the client's position to get the cursor's position relative to the target
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });
    }, []);

    const handlePointerLeave = useCallback(() => {
        setCursorState({ mode: CursorMode.Hidden })
        updateMyPresence({ cursor: null, message: null });
    }, []);

    const handlePointerDown = useCallback((event: React.PointerEvent) => {
        // subtract the target's position from the client's position to get the cursor's position relative to the target
        const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });
    }, []);

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === '/') {
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: ''
                });
            }
            else if (e.key === 'Escape') {
                updateMyPresence({ message: '' });
                setCursorState({
                    mode: CursorMode.Hidden
                });
            }
            else if (e.key === 'e') {
                setCursorState({
                    mode: CursorMode.ReactionSelector
                })
            }
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/') {
                e.preventDefault();
            }
        }

        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('keydown', onKeyDown);
        }
    }, [updateMyPresence])

    return (
        <div onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerLeave={handlePointerLeave} className="h-[100vh] w-full flex justify-center items-center text-center">
            <h1 className="text-2xl text-white">Liveblocks online collaboration tool</h1>

            {cursor && (
                <CursorChat cursor={cursor} cursorState={cursorState} setCursorState={setCursorState} updateMyPresence={updateMyPresence} />
            )}

            {cursorState.mode === CursorMode.ReactionSelector && (
                <ReactionSelector
                    setReaction={(reaction) => {
                        setReaction(reaction);
                    }}
                />
            )}

            <LiveCursors others={others} />
        </div>
    )
}

export default Live;