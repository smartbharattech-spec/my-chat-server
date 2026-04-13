import React, { useRef, useEffect } from 'react';
import { useFreeHand } from '../../services/tool/freeHandService';

const FreehandLayer = ({ imgSize }) => {
  const canvasRef = useRef(null);
  const { paths, currentPath, texts, active } = useFreeHand();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const drawPath = (path) => {
      if (!path || path.points.length < 2) return;
      
      ctx.beginPath();
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = path.size;
      
      if (path.mode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = path.color;
      }

      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    };

    // Draw saved paths
    paths.forEach(drawPath);

    // Draw current active path
    if (currentPath) {
      drawPath(currentPath);
    }

    // Reset composite operation for text
    ctx.globalCompositeOperation = 'source-over';

    // Draw Texts
    texts.forEach(t => {
        ctx.fillStyle = t.color;
        ctx.font = `bold ${t.size}px Arial`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        // Add a subtle outline to make text readable on any background
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeText(t.text, t.x, t.y);
        ctx.fillText(t.text, t.x, t.y);
    });

  }, [paths, currentPath, texts, imgSize]);

  return (
    <canvas
      ref={canvasRef}
      width={imgSize.w}
      height={imgSize.h}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 150 // Above DrawingOverlay (100)
      }}
    />
  );
};

export default React.memo(FreehandLayer);
