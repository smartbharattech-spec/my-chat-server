import React, { useState } from 'react';
import { Box, Typography, IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import { useFreeHand } from '../../services/tool/freeHandService';
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import OpenWithIcon from "@mui/icons-material/OpenWith";
import { motion } from "framer-motion";

const TextItem = ({ item, scale, onEdit, onRemove }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { updateFreeHandText } = useFreeHand();
    
    return (
        <motion.div
            style={{
                position: 'absolute',
                left: item.x,
                top: item.y,
                pointerEvents: 'auto',
                cursor: 'default',
                display: 'flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                userSelect: 'none',
                zIndex: 200,
                transform: 'translate(-50%, -50%)'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Typography
                    sx={{
                        color: item.color,
                        fontSize: `${item.size}px`,
                        fontWeight: 900,
                        textShadow: '0 0 4px white, 0 0 2px white, 1px 1px 0 white, -1px -1px 0 white',
                        lineHeight: 1,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        transition: '0.2s all',
                        border: isHovered ? '1px dashed rgba(0,0,0,0.3)' : '1px solid transparent'
                    }}
                >
                    {item.text}
                </Typography>
                
                {isHovered && (
                    <Box sx={{ 
                        position: 'absolute', 
                        top: -30, 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        display: 'flex', 
                        gap: 0.5, 
                        bgcolor: 'rgba(255,255,255,0.9)', 
                        p: 0.5, 
                        borderRadius: 2, 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 10
                    }}>
                        <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: '#3b82f6', p: 0.5 }}>
                            <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => onRemove(item.id)} sx={{ color: '#ef4444', p: 0.5 }}>
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )}
            </Box>
        </motion.div>
    );
};

const TextLayer = ({ imgSize, scale }) => {
    const { texts, removeFreeHandText, updateFreeHandText } = useFreeHand();
    const [editingItem, setEditingItem] = useState(null);
    const [tempText, setTempText] = useState("");

    const handleStartEdit = (item) => {
        setEditingItem(item);
        setTempText(item.text);
    };

    const handleSaveEdit = () => {
        if (editingItem && tempText) {
            updateFreeHandText(editingItem.id, { text: tempText });
            setEditingItem(null);
        }
    };

    return (
        <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: imgSize.w, 
            height: imgSize.h, 
            pointerEvents: 'none',
            zIndex: 160 // Above FreehandLayer (150)
        }}>
            {texts.map(t => (
                <TextItem 
                    key={t.id} 
                    item={t} 
                    scale={scale} 
                    onEdit={handleStartEdit} 
                    onRemove={removeFreeHandText}
                />
            ))}

            <Dialog 
                open={Boolean(editingItem)} 
                onClose={() => setEditingItem(null)}
                sx={{ zIndex: 999999 }}
            >
                <DialogTitle>Edit Annotation</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Text"
                        fullWidth
                        variant="standard"
                        value={tempText}
                        onChange={(e) => setTempText(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditingItem(null)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" sx={{ bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' } }}>Save</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default React.memo(TextLayer);
