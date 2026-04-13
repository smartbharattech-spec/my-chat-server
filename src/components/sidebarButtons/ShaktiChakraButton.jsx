import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, MenuItem, Switch, FormControlLabel, Slider, Zoom, ToggleButton, ToggleButtonGroup, Tooltip } from "@mui/material";
import Divider from '@mui/material/Divider';

export default function ShaktiChakraButton({ shaktiChakra, devta, validate }) {
  const { isActive, rotation, zoneCount, setActive, setRotation, setZoneCount } = shaktiChakra;
  const { isActive: isDevtaActive, setActive: setDevtaActive } = devta || {};
  const [degreeInput, setDegreeInput] = useState(rotation);
  const [baseRotation, setBaseRotation] = useState(rotation);
  const [offset, setOffset] = useState(0);

  // Sync external rotation changes
  useEffect(() => {
    const parsedInput = parseFloat(degreeInput);
    const currentRotation = parseFloat(rotation) || 0;

    // Prevent overriding user typing like "-", "", "0." which technically evaluate to 0 or NaN
    const isTypingZeroOrEmpty = isNaN(parsedInput) && currentRotation === 0;
    const isTrailingDecimal = String(degreeInput) === currentRotation + '.';

    if (parsedInput !== currentRotation && !isTypingZeroOrEmpty && !isTrailingDecimal) {
      setDegreeInput(currentRotation);
    }

    const currentOffset = parseFloat(offset) || 0;
    if (currentOffset === 0) setBaseRotation(currentRotation);
  }, [rotation, offset]);

  // Keyboard Shortcuts for Rotation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      // Ignore text-entry keys (+, -, 0) if focused on an input/textarea
      const target = e.target;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused && (e.key === '+' || e.key === '-' || e.key === '0' || e.key === '=')) {
        return;
      }

      if (e.key === 'ArrowUp' || e.key === '+' || e.key === '=') {
        adjustRotation(1);
        e.preventDefault();
      } else if (e.key === 'ArrowDown' || e.key === '-') {
        adjustRotation(-1);
        e.preventDefault();
      } else if (e.key === '0') {
        handlePreset(0);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, rotation, baseRotation, offset]); // Add rotation dep if needed, but adjustRotation uses latest state via shaktiChakra anyway

  // Handle Preset Click
  const handlePreset = (val) => {
    setBaseRotation(val);
    setRotation(val + offset); // Persist offset
  };

  // Quick increment/decrement
  const adjustRotation = (amount) => {
    const offsetInput = document.getElementById("rotation-offset-input");
    const isOffsetFocused = document.activeElement === offsetInput;

    // If offset is active OR the offset input is focused, adjust the offset
    if ((offset !== 0 && offset !== '') || isOffsetFocused) {
      const currentOffset = parseFloat(offset) || 0;
      handleOffsetChange(currentOffset + amount);
    } else {
      const newRotation = (parseFloat(rotation) || 0) + amount;
      setRotation(newRotation);
      setBaseRotation(newRotation);
      setOffset(0);
    }
  };

  // Handle Offset Change
  const handleOffsetChange = (val) => {
    setOffset(val);
    if (val === '' || val === '-') {
      setRotation(baseRotation + 0);
    } else {
      const newOffset = parseFloat(val);
      if (!isNaN(newOffset)) {
        setRotation(baseRotation + newOffset);
      }
    }
  };

  // Handle Zone Change
  const handleZoneChange = (e, val) => {
    if (!val) return;

    // Toggle devta names if 32 is clicked again
    if (val === 32 && zoneCount === 32 && setDevtaActive) {
      setDevtaActive(!isDevtaActive);
    }

    setZoneCount(val);

    // Auto-enable devta names when switching to 32 zones for the first time
    if (val === 32 && zoneCount !== 32 && setDevtaActive) {
      setDevtaActive(true);
    }
  };

  return (
    <Box>
      <Divider sx={{ mb: 2 }} />
      <FormControlLabel
        control={<Switch checked={isActive} onChange={(e) => {
          if (e.target.checked && validate && !validate()) return;
          setActive(e.target.checked);
        }} color="warning" />}
        label={<Typography fontSize={14} fontWeight={700}>Enable Energy Chakra</Typography>}
      />

      {isActive && (
        <Zoom in={isActive}>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 3 }}>
            <Box>
              <Typography fontSize={12} fontWeight={600} sx={{ mb: 1 }}>North Orientation (Degrees)</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
                <Slider
                  value={Number(rotation) || 0}
                  onChange={(e, val) => {
                    setRotation(val);
                    setBaseRotation(val);
                    setOffset(0);
                  }}
                  min={-360} max={360} step={0.1}
                  sx={{ color: "#f97316", flexGrow: 1 }}
                />
                <TextField
                  value={degreeInput}
                  onChange={(e) => {
                    const val = String(e.target.value);
                    setDegreeInput(val);

                    if (val === '' || val === '-') {
                      setRotation(0);
                      setBaseRotation(0);
                      setOffset(0);
                      return;
                    }

                    const v = parseFloat(val);
                    if (!isNaN(v)) {
                      setRotation(v);
                      setBaseRotation(v);
                      setOffset(0);
                    }
                  }}
                  size="small" variant="outlined"
                  inputProps={{ style: { fontSize: 13, fontWeight: 700, textAlign: 'center' } }}
                  sx={{ width: 95, "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "white" } }}
                />
              </Box>

              {/* CARDINAL PRESETS */}
              <Typography fontSize={10} color="text.secondary" fontWeight={700} sx={{ mb: 0.5 }}>QUICK ROTATE:</Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {[
                  { label: 'Up', val: 0, full: 'North' },
                  { label: 'Right', val: 90, full: 'East' },
                  { label: 'Down', val: 180, full: 'South' },
                  { label: 'Left', val: 270, full: 'West' }
                ].map((preset) => (
                  <Tooltip key={preset.label} title={`Rotate to ${preset.label} (${preset.full} - 0°)`}>
                    <Box
                      onClick={() => handlePreset(preset.val)}
                      sx={{
                        px: 1.2, py: 0.5,
                        bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 1.5,
                        fontSize: 10, fontWeight: 700, color: '#475569', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                      }}
                    >
                      {preset.label}
                    </Box>
                  </Tooltip>
                ))}
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Tooltip title="Decrease by 1 degree">
                  <Box
                    onClick={() => adjustRotation(-1)}
                    sx={{
                      px: 1.5, py: 0.5,
                      bgcolor: '#fff', border: '1px solid #f97316', borderRadius: 1.5,
                      fontSize: 14, fontWeight: 900, color: '#f97316', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      '&:hover': { bgcolor: '#fff7ed', borderColor: '#ea580c' },
                      minWidth: 32
                    }}
                  >
                    -
                  </Box>
                </Tooltip>

                <Tooltip title="Increase by 1 degree">
                  <Box
                    onClick={() => adjustRotation(1)}
                    sx={{
                      px: 1.5, py: 0.5,
                      bgcolor: '#fff', border: '1px solid #f97316', borderRadius: 1.5,
                      fontSize: 14, fontWeight: 900, color: '#f97316', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      '&:hover': { bgcolor: '#fff7ed', borderColor: '#ea580c' },
                      minWidth: 32
                    }}
                  >
                    +
                  </Box>
                </Tooltip>
              </Box>

              {/* ADDITIVE OFFSET */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, bgcolor: 'rgba(249, 115, 22, 0.1)', p: 1, borderRadius: 2 }}>
                <Typography fontSize={11} fontWeight={700} sx={{ flexGrow: 1 }}>
                  Add Degrees (+/-):
                </Typography>
                <TextField
                  id="rotation-offset-input"
                  size="small"
                  value={offset}
                  onChange={(e) => handleOffsetChange(e.target.value)}
                  sx={{ width: 80, bgcolor: 'white', borderRadius: 1 }}
                  inputProps={{ style: { fontSize: 13, fontWeight: 700, textAlign: 'center' } }}
                  placeholder="0"
                />
              </Box>
            </Box>
            <Box>
              <Typography fontSize={12} fontWeight={600} sx={{ mb: 1 }}>Zone Divisions</Typography>
              <ToggleButtonGroup
                value={Number(zoneCount)}
                exclusive
                onChange={handleZoneChange}
                fullWidth
                size="small"
                sx={{ bgcolor: "#fff", borderRadius: 2 }}
              >
                <Tooltip title="Divide into 8 Directions">
                  <ToggleButton value={8} sx={{ fontWeight: 700 }}>8 Zones</ToggleButton>
                </Tooltip>
                <Tooltip title="Divide into 16 Zones (Vastu)">
                  <ToggleButton value={16} sx={{ fontWeight: 700 }}>16 Zones</ToggleButton>
                </Tooltip>
                <Tooltip title="Divide into 32 Zones (Advanced)">
                  <ToggleButton value={32} sx={{ fontWeight: 700 }}>32 Zones</ToggleButton>
                </Tooltip>
              </ToggleButtonGroup>

              {/* 🕉️ DEVTA NAMES TOGGLE (Visible only in 32 Zones) */}
              {zoneCount === 32 && devta && (
                <Zoom in={zoneCount === 32}>
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: "rgba(249, 115, 22, 0.08)", borderRadius: 3, border: "1px dashed #f97316", display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography fontSize={12} fontWeight={800} color="#ea580c">Show 32 Devta Names</Typography>
                    <Switch
                      size="small"
                      checked={isDevtaActive}
                      onChange={(e) => setDevtaActive(e.target.checked)}
                      color="warning"
                    />
                  </Box>
                </Zoom>
              )}
            </Box>

            {/* NEW CUSTOMIZATIONS */}
            {/* NEW CUSTOMIZATIONS */}
            <Box sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.5)", borderRadius: 2 }}>
              <Typography fontSize={11} fontWeight={800} color="#f97316" sx={{ mb: 1.5, letterSpacing: 0.5 }}>
                VISUAL SETTINGS
              </Typography>

              {/* Line Thickness */}
              <Box sx={{ mb: 2 }}>
                <Typography fontSize={10} fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  LINE THICKNESS
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Slider
                    size="small"
                    value={Number(shaktiChakra.lineThickness) || 1}
                    min={0.5} max={10} step={0.5}
                    onChange={(e, val) => shaktiChakra.setLineThickness(val)}
                    sx={{ color: '#f97316', flexGrow: 1 }}
                  />
                  <TextField
                    value={shaktiChakra.lineThickness !== undefined ? shaktiChakra.lineThickness : 1}
                    onChange={(e) => shaktiChakra.setLineThickness(e.target.value)}
                    size="small"
                    sx={{ width: 65, bgcolor: 'white' }}
                    inputProps={{ style: { fontSize: 11, padding: '4px 8px', fontWeight: 700, textAlign: 'center' } }}
                  />
                </Box>
              </Box>

              {/* Font Size */}
              <Box sx={{ mb: 2 }}>
                <Typography fontSize={10} fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  LABEL FONT SIZE
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Slider
                    size="small"
                    value={Number(shaktiChakra.labelSize) || 12}
                    min={8} max={60} step={1}
                    onChange={(e, val) => shaktiChakra.setLabelSize(val)}
                    sx={{ color: '#f97316', flexGrow: 1 }}
                  />
                  <TextField
                    value={shaktiChakra.labelSize !== undefined ? shaktiChakra.labelSize : 12}
                    onChange={(e) => shaktiChakra.setLabelSize(e.target.value)}
                    size="small"
                    sx={{ width: 65, bgcolor: 'white' }}
                    inputProps={{ style: { fontSize: 11, padding: '4px 8px', fontWeight: 700, textAlign: 'center' } }}
                  />
                </Box>
              </Box>

              {/* Label Distance */}
              <Box>
                <Typography fontSize={10} fontWeight={700} color="text.secondary" sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                  LABEL DISTANCE (%)
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Slider
                    size="small"
                    value={Number(shaktiChakra.labelDistance) || 0}
                    min={-50} max={100} step={1}
                    onChange={(e, val) => shaktiChakra.setLabelDistance(val)}
                    sx={{ color: '#f97316', flexGrow: 1 }}
                  />
                  <TextField
                    value={shaktiChakra.labelDistance !== undefined ? shaktiChakra.labelDistance : 0}
                    onChange={(e) => shaktiChakra.setLabelDistance(e.target.value)}
                    size="small"
                    sx={{ width: 65, bgcolor: 'white' }}
                    inputProps={{ style: { fontSize: 11, padding: '4px 8px', fontWeight: 700, textAlign: 'center' } }}
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </Zoom>
      )}
    </Box>
  );
}