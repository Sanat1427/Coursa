import React from 'react'
import { AbsoluteFill } from 'remotion'

function ChapterVideo({ chapter }: { chapter?: any }) {
    return (
        <AbsoluteFill style={{ backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
            <h2 style={{ fontSize: 80, color: 'white', fontWeight: 'bold' }}>{chapter?.chapterTitle || 'No preview available'}</h2>
        </AbsoluteFill>
    )
}

export default ChapterVideo