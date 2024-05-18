import { LiveCursorProps } from '@/types/type'
import React from 'react'
import Cursor from './Cursor';
import { COLORS } from '@/constants';

const LiveCursors = ({ others }: LiveCursorProps) => {
    // it maps each user's cursor and return the cursor component for each user
    return others.map(({ connectionId, presence }) => {
        if (!presence?.cursor) return null;

        return (
            <Cursor key={connectionId}
                color={COLORS[Number(connectionId) % COLORS.length]}
                x={presence.cursor.x}
                y={presence.cursor.y}
                message={presence.message}
            />
        )
    })
}

export default LiveCursors