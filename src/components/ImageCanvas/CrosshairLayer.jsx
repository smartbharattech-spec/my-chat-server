import React from 'react';
import { useMousePos } from '../../services/tool/boundaryService';
import { useFreeHand } from '../../services/tool/freeHandService';

/**
 * Isolated high-frequency layer for drawing crosshairs.
 * Decoupled from heavy geometry to prevent lag during mouse movement.
 */
const CrosshairLayer = () => {
    const mousePos = useMousePos();
    const { isDrawing } = useFreeHand();

    // Hide if mouse is not over image OR if actively drawing
    if (!mousePos || isDrawing) return null;

    return (
        <svg
            id="crosshair-layer"
            width="100%"
            height="100%"
            style={{
                position: "absolute",
                inset: 0,
                zIndex: 150,
                pointerEvents: "none"
            }}
        >
            <g id="drawing-guides" style={{ pointerEvents: 'none' }}>
                <line
                    x1="0" y1={mousePos.y}
                    x2="10000" y2={mousePos.y}
                    stroke="#000000"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    opacity="0.6"
                />
                <line
                    x1={mousePos.x} y1="0"
                    x2={mousePos.x} y2="10000"
                    stroke="#000000"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                    opacity="0.6"
                />
            </g>
        </svg>
    );
};

export default React.memo(CrosshairLayer);
