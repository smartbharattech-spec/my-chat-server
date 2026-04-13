/**
 * Auto-Boundary Detection Service (Pro v4 - NOISE NINJA)
 * Features: Center of Mass, Distance Smoothing (Median Filter), RDP Simplification.
 */

export async function detectBoundary(imageSrc) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const MAX_DIM = 800; // Optimal for speed/accuracy trade-off
        let w = img.naturalWidth;
        let h = img.naturalHeight;

        if (w > MAX_DIM || h > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;

        // 1. Identify all wall-like pixels
        const candidates = [];
        const threshold = 120;

        for (let y = 0; y < h; y += 2) {
          for (let x = 0; x < w; x += 2) {
            const idx = (y * w + x) * 4;
            const brightness = (data[idx] + data[idx+1] + data[idx+2]) / 3;
            if (data[idx+3] > 50 && brightness < threshold) {
              candidates.push({ x, y });
            }
          }
        }

        if (candidates.length < 20) return reject("No clear boundary found.");

        // 2. Identify TRUE center of the floor plan (Mass Center)
        let sumX = 0, sumY = 0;
        candidates.forEach(p => { sumX += p.x; sumY += p.y; });
        const massCX = sumX / candidates.length;
        const massCY = sumY / candidates.length;

        // 3. Radial Scan with Noise Filtering
        const sectors = 120;
        const maxDists = new Array(sectors).fill(0);
        
        candidates.forEach(p => {
          const dx = p.x - massCX;
          const dy = p.y - massCY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          let angle = Math.atan2(dy, dx) * 180 / Math.PI;
          if (angle < 0) angle += 360;
          
          const sectorIdx = Math.floor((angle / 360) * sectors) % sectors;
          if (dist > maxDists[sectorIdx]) {
            maxDists[sectorIdx] = dist;
          }
        });

        // 4. SMOOTHING: Median filter to remove spikes (text, dimension lines)
        const smoothedDists = new Array(sectors);
        const windowSize = 3; // Look at neighbors to ignore spikes
        for (let i = 0; i < sectors; i++) {
            const neighbors = [];
            for (let j = -windowSize; j <= windowSize; j++) {
                neighbors.push(maxDists[(i + j + sectors) % sectors]);
            }
            // Sort to get median
            neighbors.sort((a, b) => a - b);
            smoothedDists[i] = neighbors[Math.floor(neighbors.length / 2)];
        }

        // 5. Reconstruct points from smoothed distances
        const processedPoints = [];
        for (let i = 0; i < sectors; i++) {
            if (smoothedDists[i] > 0) {
                const rad = (i * (360 / sectors)) * (Math.PI / 180);
                processedPoints.push({
                    x: massCX + Math.cos(rad) * smoothedDists[i],
                    y: massCY + Math.sin(rad) * smoothedDists[i]
                });
            }
        }

        // 6. Simplify (More aggressive)
        const simplified = simplifyRDP(processedPoints, 10);

        // 7. Cleanup near-duplicates or collinear points
        const finalResults = [];
        if (simplified.length > 3) {
            for (let i = 0; i < simplified.length; i++) {
                const p1 = simplified[(i - 1 + simplified.length) % simplified.length];
                const p2 = simplified[i];
                const p3 = simplified[(i + 1) % simplified.length];
                
                const angle = calculateAngle(p1, p2, p3);
                if (Math.abs(180 - angle) > 10) { // Keep if it's a real corner
                    finalResults.push(p2);
                }
            }
        } else {
            finalResults.push(...simplified);
        }

        // 8. Scale back
        const ratioX = img.naturalWidth / w;
        const ratioY = img.naturalHeight / h;
        resolve(finalResults.map(p => ({
            x: Math.round(p.x * ratioX),
            y: Math.round(p.y * ratioY)
        })));

      } catch (err) { reject(err); }
    };
    img.onerror = () => reject("Image error.");
  });
}

function simplifyRDP(points, epsilon) {
    if (points.length <= 2) return points;
    let maxDist = 0, index = 0;
    for (let i = 1; i < points.length - 1; i++) {
        const d = findPerpendicularDistance(points[i], points[0], points[points.length-1]);
        if (d > maxDist) { index = i; maxDist = d; }
    }
    if (maxDist > epsilon) {
        const left = simplifyRDP(points.slice(0, index + 1), epsilon);
        const right = simplifyRDP(points.slice(index), epsilon);
        return [...left.slice(0, -1), ...right];
    }
    return [points[0], points[points.length-1]];
}

function findPerpendicularDistance(p, p1, p2) {
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) return Math.sqrt((p.x-p1.x)**2 + (p.y-p1.y)**2);
    return Math.abs(dy * p.x - dx * p.y + p2.x * p1.y - p2.y * p1.x) / mag;
}

function calculateAngle(A, B, C) {
    const d1 = { x: A.x - B.x, y: A.y - B.y }, d2 = { x: C.x - B.x, y: C.y - B.y };
    const dot = d1.x * d2.x + d1.y * d2.y;
    const mag1 = Math.sqrt(d1.x * d1.x + d1.y * d1.y), mag2 = Math.sqrt(d2.x * d2.x + d2.y * d2.y);
    const cos = dot / (mag1 * mag2);
    return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
}
