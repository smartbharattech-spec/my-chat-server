
// --- Helper: Calculate Polygon Area (Shoelace Formula) ---
export const calculatePolygonArea = (points) => {
    if (!points || points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
};

// --- Helper: Clip Polygon with Line (Sutherland-Hodgman Helper) ---
// Returns vertices of polygon visible on the "left" (or valid) side of the line defined by p1->p2
const clipPolygonAgainstLine = (subjectPolygon, p1, p2) => {
    const newPolygon = [];
    if (subjectPolygon.length === 0) return [];

    const isInside = (p) => {
        return (p2.x - p1.x) * (p.y - p1.y) > (p2.y - p1.y) * (p.x - p1.x);
    };

    const intersection = (a, b) => {
        const dc = { x: a.x - b.x, y: a.y - b.y };
        const dp = { x: p1.x - p2.x, y: p1.y - p2.y };
        const n1 = a.x * b.y - a.y * b.x;
        const n2 = p1.x * p2.y - p1.y * p2.x;
        const n3 = 1 / (dc.x * dp.y - dc.y * dp.x);
        return {
            x: ((n1 * dp.x) - (dc.x * n2)) * n3,
            y: ((n1 * dp.y) - (dc.y * n2)) * n3,
        };
    };

    // Re-implementing standard intersection for clarity
    const getIntersection = (cp1, cp2, s, e) => {
        const dc = { x: cp1.x - cp2.x, y: cp1.y - cp2.y };
        const dp = { x: s.x - e.x, y: s.y - e.y };
        const n1 = cp1.x * cp2.y - cp1.y * cp2.x;
        const n2 = s.x * e.y - s.y * e.x;
        const n3 = 1.0 / (dc.x * dp.y - dc.y * dp.x);
        return {
            x: (n1 * dp.x - dc.x * n2) * n3,
            y: (n1 * dp.y - dc.y * n2) * n3,
        };
    };

    let cp1 = subjectPolygon[subjectPolygon.length - 1]; // Start with last point
    for (let i = 0; i < subjectPolygon.length; i++) {
        const cp2 = subjectPolygon[i];
        if (isInside(cp2)) {
            if (!isInside(cp1)) {
                newPolygon.push(getIntersection(cp1, cp2, p1, p2));
            }
            newPolygon.push(cp2);
        } else if (isInside(cp1)) {
            newPolygon.push(getIntersection(cp1, cp2, p1, p2));
        }
        cp1 = cp2;
    }
    return newPolygon;
};

// --- Helper: Convert Angle to large ray point ---
const getRayPoint = (center, angleDeg, length = 10000) => {
    // Angle logic: In our system 0 is Top (North) or Right (East)?
    // Based on other files: 0 deg Vastu is North (Top).
    // Math: 0 is Right. Vastu N(0) => -90 Math.
    // Formula used elsewhere: ((-90 + angle) * PI) / 180
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: center.x + length * Math.cos(angleRad),
        y: center.y + length * Math.sin(angleRad),
    };
};


import { getZoneLabel } from "./shaktiChakraService";

/**
 * Main Calculation Function
 * @param {Object} center - {x, y}
 * @param {Array} boundaryPoints - [{x,y}, ...]
 * @param {Number} rotation - Map rotation in degrees
 * @param {Number} zoneCount - 16 or 32
 */
export const calculateZoneAreas = (center, boundaryPoints, rotation, zoneCount) => {
    if (!center || !boundaryPoints || boundaryPoints.length < 3) return [];

    const results = [];
    const safeZoneCount = zoneCount || 16;
    const step = 360 / safeZoneCount;

    // Calculate total Plot Area
    const totalPlotArea = calculatePolygonArea(boundaryPoints);
    if (totalPlotArea === 0) return [];

    // Zone Offset Logic (Same as ShaktiChakra)
    // 16 Zones: N is centered. Index 0 covers [-11.25, +11.25].
    // 32 Zones: Index 0 starts at 0. [0, 11.25].
    const offset = safeZoneCount === 32 ? 0 : step / 2;

    // We need to iterate 0 to N-1
    for (let i = 0; i < safeZoneCount; i++) {
        // Zone Start/End Angles (Vastu Degrees, 0=N, CW)
        // For 16 Zones, i=0 (North) starts at -11.25, ends at +11.25
        let startAngleVastu = (i * step) - offset + rotation;
        let endAngleVastu = startAngleVastu + step;

        // Normalize to 0-360 not strictly needed for math but good for debugging
        // But our ray calculation handles any degree.

        // Define the Wedge (Triangle) defined by Center -> RayStart -> RayEnd -> Center
        // But for arbitrary polygon clipping, we treat it as clipping against 2 lines:
        // Line 1: Center -> RayStart (Right side of line is outside)
        // Line 2: RayEnd -> Center (Right side of line is outside)

        // Wait, Sutherland-Hodgman clips against infinite lines.
        // The "Wedge" is defined by two half-planes intersecting.

        // Ray 1: Angle Start
        const pStart = getRayPoint(center, startAngleVastu, 20000);
        // Ray 2: Angle End
        const pEnd = getRayPoint(center, endAngleVastu, 20000);

        // We clip the WHOLE boundary polygon against these two lines.
        // Order matters for "Inside" check.
        // If we walk Center -> pStart, "Inside" is to the right? Or Left?
        // isInside ref logic: (p2.x - p1.x)*(p.y - p1.y) > ... (Cross product Z component)
        // Let's test standard winding.
        // If we define lines as [Center -> pStart] and [pEnd -> Center], the "Inside" of the wedge should be consistently on one side (Left).

        // Let's assume Counter-Clockwise clipping for standard math?
        // Vastu angles are Clockwise.
        // Let's stick to our Clip helper.

        // We clip boundary against Line(Center -> pStart) keeping "Left" side?
        // CW: N(0) -> E(90).
        // StartAngle < EndAngle.
        // Vector Center->Start. Vector Center->End.
        // The area *between* Center->Start and Center->End (going CW).

        // 1. Clip against Center -> pStart. We want points "Right" of this vector (CW from it).
        // 2. Clip against pEnd -> Center. We want points "Right" of this vector?

        // Actually, safer approach for "Sector" clipping without full generalized clipper:
        // Create a huge triangle/polygon for the sector [Center, pStart, pEnd] and intersect it.
        // Sutherland-Hodgman for convex polygons (Sector is convex) works.
        // But the Map Boundary might be Concave (L-shaped).
        // So we must clip the Map Boundary (Subject) against the Sector (Clipper).
        // The Sector can be represented as 3 points: Center, pStart, pEnd. (Assuming < 180 deg).
        // We clip the Map against edge (Center->pStart), then (pStart->pEnd), then (pEnd->Center).

        let clippedPoly = boundaryPoints;

        // Clip 1: Center -> pStart
        // We want the side where the "Next" angle is. (CW direction).
        // So if we look from Center to pStart, the "Inside" is to the Right?
        // Let's verify isInside: (p2.x - p1.x)*(py - p1.y) > (p2.y - p1.y)*(px - p1.x)
        // effectively (v.x * dy) - (v.y * dx) > 0.
        // This assumes a certain handedness.

        // To allow robustness:
        // We create the Sector Polygon: [Center, pStart, pEnd].
        // Note: pStart and pEnd are far away.
        // We iterate edges of Sector Polygon and clip Subject.

        const sectorPoly = [center, pStart, pEnd];

        // Clip subject against each edge of sectorPoly
        for (let j = 0; j < sectorPoly.length; j++) {
            const c1 = sectorPoly[j];
            const c2 = sectorPoly[(j + 1) % sectorPoly.length];
            clippedPoly = clipPolygonAgainstLine(clippedPoly, c1, c2);
            if (clippedPoly.length === 0) break;
        }

        const area = calculatePolygonArea(clippedPoly);
        const percent = (area / totalPlotArea) * 100;

        results.push({
            zone: getZoneLabel(i, safeZoneCount),
            area: area.toFixed(2),
            percent: percent.toFixed(1) + "%",
            color: getZoneColor(i, safeZoneCount) // We'll add a helper for this
        });
    }

    return results;
};


// Helper for Colors (matching the screenshot roughly)
const getZoneColor = (index, count) => {
    const colors = [
        "#3b82f6", "#60a5fa", "#93c5fd", "#22c55e",
        "#16a34a", "#15803d", "#ef4444", "#dc2626",
        "#b91c1c", "#f59e0b", "#d97706", "#b45309",
        "#a855f7", "#7e22ce", "#6366f1", "#4338ca",
    ];
    return colors[Math.floor(index * (16 / count)) % 16];
};

const OUTER_32_NAMES = [
    "Soma", "Bhujang", "Aditi", "Diti",
    "Shikhi", "Parjanya", "Jayant", "Mahendra",
    "Surya", "Satya", "Bhrisha", "Antariksha",
    "Agni", "Pusha", "Vitatha", "Grihakshat",
    "Yama", "Gandharva", "Bhringraj", "Mriga",
    "Pitri", "Dauvarika", "Sugriva", "Pushpadanta",
    "Varuna", "Asura", "Sosha", "Papyakshman",
    "Roga", "Naga", "Mukhya", "Bhallat"
];

const FOUR_INNER_NAMES = ["Bhudhar", "Aryama", "Vivasvan", "Mitra"];
const EIGHT_MIDDLE_NAMES = ["", "Aap", "", "Savitra", "", "Jaya", "", "Rajyakshman"];

/**
 * --- HELPER: Create a Ring Wedge Polygon ---
 * Approximates a sector/ring-part as a polygon for clipping.
 * Higher segments = better precision.
 */
const createRingWedgePolygon = (center, startAngle, endAngle, innerR, outerR) => {
    const points = [];
    const isCircle = Math.abs(endAngle - startAngle) >= 359;
    const segments = isCircle ? 32 : 16;

    if (isCircle && innerR === 0) {
        // For a full circle center, just a simple regular polygon
        for (let i = 0; i < segments; i++) {
            const angle = startAngle + (360 * i / segments);
            const rad = (angle - 90) * Math.PI / 180;
            points.push({
                x: center.x + outerR * Math.cos(rad),
                y: center.y + outerR * Math.sin(rad)
            });
        }
        return points;
    }

    // Outer Arc
    for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (endAngle - startAngle) * (i / segments);
        const rad = (angle - 90) * Math.PI / 180;
        points.push({
            x: center.x + outerR * Math.cos(rad),
            y: center.y + outerR * Math.sin(rad)
        });
    }

    // Inner Arc
    if (innerR > 0) {
        for (let i = segments; i >= 0; i--) {
            const angle = startAngle + (endAngle - startAngle) * (i / segments);
            const rad = (angle - 90) * Math.PI / 180;
            points.push({
                x: center.x + innerR * Math.cos(rad),
                y: center.y + innerR * Math.sin(rad)
            });
        }
    } else {
        // If innerR is 0, we just close at the center point
        points.push({ x: center.x, y: center.y });
    }

    return points;
};

/**
 * DEVTA AREA CALCULATION
 */
export const calculateDevtaAreas = (center, boundaryPoints, rotation, mandalaSize) => {
    if (!center || !boundaryPoints || boundaryPoints.length < 3) return [];

    // 1. Calculate base Radius (max distance to boundary)
    let maxDist = 0;
    boundaryPoints.forEach(p => {
        const dist = Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2));
        if (dist > maxDist) maxDist = dist;
    });

    const R = maxDist * (mandalaSize || 1.0);
    const rB = R * 0.15;
    const r4 = R * 0.40;
    const r8 = R * 0.65;
    const r32 = R;

    const totalPlotArea = calculatePolygonArea(boundaryPoints);
    const results = [];

    // Helper to clip the boundary against a Devta shape (Clipper must be Convex)
    const clipBoundaryAgainstDevta = (devtaPoly) => {
        let clipped = boundaryPoints;
        for (let i = 0; i < devtaPoly.length; i++) {
            const p1 = devtaPoly[i];
            const p2 = devtaPoly[(i + 1) % devtaPoly.length];
            clipped = clipPolygonAgainstLine(clipped, p1, p2);
            if (clipped.length === 0) break;
        }
        const area = calculatePolygonArea(clipped);
        return area;
    };

    // --- 1. Brahma (Brahmasthan Center) ---
    const brahmaPoly = createRingWedgePolygon(center, 0, 360, 0, rB);
    const brahmaArea = clipBoundaryAgainstDevta(brahmaPoly);
    results.push({
        devta: "Brahma",
        area: brahmaArea.toFixed(2),
        percent: ((brahmaArea / totalPlotArea) * 100).toFixed(1) + "%",
        color: "#fbbf24" // Yellowish
    });

    // --- 2. Four Inner Devtas ---
    FOUR_INNER_NAMES.forEach((name, i) => {
        const step = 90;
        const start = i * step - 45 + rotation;
        const end = start + step;
        const wedge = createRingWedgePolygon(center, start, end, rB, r4);
        const area = clipBoundaryAgainstDevta(wedge);
        results.push({
            devta: name,
            area: area.toFixed(2),
            percent: ((area / totalPlotArea) * 100).toFixed(1) + "%",
            color: (i % 2 === 0 ? "#4ade80" : "#60a5fa")
        });
    });

    // --- 3. Eight Middle Devtas ---
    EIGHT_MIDDLE_NAMES.forEach((name, i) => {
        const step = 45;
        const start = i * step - 22.5 + rotation;
        const end = start + step;
        const wedge = createRingWedgePolygon(center, start, end, r4, r8);
        const area = clipBoundaryAgainstDevta(wedge);
        results.push({
            devta: name,
            area: area.toFixed(2),
            percent: ((area / totalPlotArea) * 100).toFixed(1) + "%",
            color: (i % 2 === 0 ? "#f97316" : "#94a3b8")
        });
    });

    // --- 4. Outer 32 Devtas ---
    OUTER_32_NAMES.forEach((name, i) => {
        const step = 11.25;
        const start = i * step - (step / 2) + rotation;
        const end = start + step;
        const wedge = createRingWedgePolygon(center, start, end, r8, r32);
        const area = clipBoundaryAgainstDevta(wedge);
        results.push({
            devta: name,
            area: area.toFixed(2),
            percent: ((area / totalPlotArea) * 100).toFixed(1) + "%",
            color: (i % 4 === 0 ? "#db2777" : "#cbd5e1")
        });
    });

    return results;
};
