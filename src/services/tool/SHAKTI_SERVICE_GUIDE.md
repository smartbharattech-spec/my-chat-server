# 🔮 SHAKTI CHAKRA SERVICE - Complete Guide

## Overview
Service-based state management - ksi bhi component mein import karke use karo, props drilling nahi.

---

## 📌 **Option 1: React Components (Recommended)**

### Use in any React component:

```jsx
import { useShaktiChakra } from "../services/tool/shaktiChakraService";

export default function MyComponent() {
  // Hook se directly state aur functions lo
  const { 
    isActive, 
    rotation, 
    zoneCount,
    setActive,
    setRotation,
    setZoneCount,
    reset 
  } = useShaktiChakra();

  return (
    <div>
      <p>Chakra Active: {isActive}</p>
      <p>Rotation: {rotation}°</p>
      <p>Zones: {zoneCount}</p>
      
      <button onClick={() => setActive(!isActive)}>
        Toggle Chakra
      </button>
      
      <button onClick={() => setRotation(45)}>
        Set Rotation 45°
      </button>
      
      <button onClick={() => setZoneCount(32)}>
        32 Zones
      </button>
      
      <button onClick={() => reset()}>
        Reset All
      </button>
    </div>
  );
}
```

---

## 📌 **Option 2: Non-React Code (JavaScript)**

### Use in regular JS files:

```javascript
import { shaktiChakraService } from "../services/tool/shaktiChakraService";

// Get current state (anytime)
const state = shaktiChakraService.getState();
console.log(state); // { isActive, rotation, zoneCount }

// Check specific values
const isActive = shaktiChakraService.isActive(); // true/false
const rotation = shaktiChakraService.getRotation(); // 0-360
const zoneCount = shaktiChakraService.getZoneCount(); // 8/16/32

// Update state
shaktiChakraService.setActive(true);
shaktiChakraService.setRotation(90);
shaktiChakraService.setZoneCount(16);

// Listen to changes (observer pattern)
const unsubscribe = shaktiChakraService.subscribe((newState) => {
  console.log("State changed:", newState);
});

// Later, unsubscribe if needed
unsubscribe();

// Reset everything
shaktiChakraService.reset();
```

---

## 🔄 **State Properties**

| Property   | Type      | Default | Range/Values           |
|-----------|----------|---------|----------------------|
| isActive  | boolean  | false   | true / false         |
| rotation  | number   | 0       | 0 to 360 degrees     |
| zoneCount | number   | 16      | 8, 16, or 32         |

---

## 🎯 **Real-World Examples**

### Example 1: Control Chakra from Different Components

**In ToolModules.jsx:**
```jsx
import { useShaktiChakra } from "../services/tool/shaktiChakraService";

export default function ToolModules() {
  const { isActive, setActive } = useShaktiChakra();
  
  return <Switch checked={isActive} onChange={(e) => setActive(e.target.checked)} />;
}
```

**In ImageCanvas.jsx:**
```jsx
import { useShaktiChakra } from "../services/tool/shaktiChakraService";

export default function ImageCanvas({ image }) {
  const { isActive, rotation, zoneCount } = useShaktiChakra();
  
  return (
    <DrawingOverlay 
      isActive={isActive}
      rotation={rotation}
      zoneCount={zoneCount}
    />
  );
}
```

Both use same state automatically! 🔄

---

### Example 2: Listen to Changes in Non-React Code

**In analytics.js:**
```javascript
import { shaktiChakraService } from "../services/tool/shaktiChakraService";

// Subscribe to ALL changes
shaktiChakraService.subscribe((newState) => {
  console.log("User changed chakra settings:", newState);
  // Send to analytics, API, localStorage, etc.
});
```

---

### Example 3: Save/Load from LocalStorage

**In persistence.js:**
```javascript
import { shaktiChakraService } from "../services/tool/shaktiChakraService";

// Save to localStorage
function saveShaktiState() {
  const state = shaktiChakraService.getState();
  localStorage.setItem('shaktiState', JSON.stringify(state));
}

// Load from localStorage
function loadShaktiState() {
  const saved = localStorage.getItem('shaktiState');
  if (saved) {
    const state = JSON.parse(saved);
    shaktiChakraService.setActive(state.isActive);
    shaktiChakraService.setRotation(state.rotation);
    shaktiChakraService.setZoneCount(state.zoneCount);
  }
}

// Subscribe and auto-save whenever state changes
shaktiChakraService.subscribe(() => saveShaktiState());
```

---

## ✅ **Benefits of This Architecture**

✓ **No Props Drilling** - Import anywhere, use anytime  
✓ **Centralized State** - Single source of truth  
✓ **Reactive** - Components auto-update on state change  
✓ **Works in React & Non-React** - Use anywhere  
✓ **Clean Code** - No messy prop chains  
✓ **Easy Testing** - Mock the service easily  
✓ **Observable Pattern** - Subscribe to changes  

---

## 🚀 **Import Paths**

```javascript
// React Hook
import { useShaktiChakra } from "@/services/tool/shaktiChakraService";

// Direct Service (Non-React)
import { shaktiChakraService } from "@/services/tool/shaktiChakraService";

// Utility Functions
import { getZoneLabel, getPointAtAngle } from "@/services/tool/shaktiChakraService";
```

---

## 💡 **Pro Tips**

1. **Always use the hook in React components** - `useShaktiChakra()`
2. **Use the service object in plain JS** - `shaktiChakraService.getState()`
3. **Subscribe for real-time updates** - Perfect for logging/analytics
4. **Reset when needed** - `reset()` clears all to defaults
5. **No state sync issues** - Everything is automatically synchronized

---

Happy coding! 🎉
