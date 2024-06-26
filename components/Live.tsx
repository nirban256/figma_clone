import React, { useCallback, useEffect, useState } from 'react'
import LiveCursors from './cursor/LiveCursors'
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from '@/liveblocks.config'
import { CursorMode, CursorState, Reaction, ReactionEvent } from '@/types/type';
import CursorChat from './cursor/CursorChat';
import ReactionSelector from './reaction/ReactionButton';
import FlyingReaction from './reaction/FlyingReaction';
import useInterval from '@/hooks/useInterval';

type Props = {
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
}

const Live = ({ canvasRef }: Props) => {
    const others = useOthers();
    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const [reaction, setReaction] = useState<Reaction[]>([]);

    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    });

    const broadcast = useBroadcastEvent();

    useInterval(() => {
        setReaction((reactions) => reaction.filter((r) => {
            r.timestamp > Date.now() - 3000;
        }))
    }, 1000);

    useInterval(() => {
        if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
            setReaction((reactions) => reactions.concat([
                {
                    point: { x: cursor.x, y: cursor.y },
                    value: cursorState.reaction,
                    timestamp: Date.now()
                }
            ]));

            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: cursorState.reaction
            });
        }
    }, 60);

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent;

        setReaction((reactions) => reactions.concat([
            {
                point: { x: event.x, y: event.y },
                value: event.value,
                timestamp: Date.now()
            }
        ]));
    });

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();
        // subtract the target's position from the client's position to get the cursor's position relative to the target
        if (cursor === null || cursorState.mode !== CursorMode.ReactionSelector) {
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

            updateMyPresence({ cursor: { x, y } });
        }
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

        setCursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state);
    }, [cursorState.mode, setCursorState]);

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setCursorState((state: CursorState) => cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state);
    }, [cursorState.mode, setCursorState]);

    const setReactions = useCallback((reaction: string) => {
        setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
    }, [])

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
        <div id='canvas' onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerLeave={handlePointerLeave} onPointerUp={handlePointerUp} className="h-[100vh] w-full flex justify-center items-center text-center">
            <canvas ref={canvasRef} />

            {
                reaction.map((r) => (
                    <FlyingReaction
                        key={r.timestamp.toString()}
                        x={r.point.x}
                        y={r.point.y}
                        timestamp={r.timestamp}
                        value={r.value}
                    />
                ))
            }

            {cursor && (
                <CursorChat cursor={cursor} cursorState={cursorState} setCursorState={setCursorState} updateMyPresence={updateMyPresence} />
            )}

            {/* If cursor is in reaction selector mode, show the reaction selector */}
            {cursorState.mode === CursorMode.ReactionSelector && (
                <ReactionSelector
                    setReaction={setReactions}
                />
            )}

            <LiveCursors others={others} />
        </div>
    )
}

export default Live;