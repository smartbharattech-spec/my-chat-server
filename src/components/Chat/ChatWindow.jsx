import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom'; // Added for Portals
import { 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  IconButton, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  CircularProgress,
  Badge,
  useTheme,
  useMediaQuery,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider
} from '@mui/material';
import { 
  Send as SendIcon, 
  Close as CloseIcon, 
  Image as ImageIcon, 
  EmojiEmotions as EmojiIcon,
  ArrowBack as BackIcon,
  ScreenShare as ScreenShareIcon,
  VideoChat as VideoIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Stop as StopIcon,
  Call as CallIcon,
  Videocam as VideocamIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  CallEnd as CallEndIcon,
  VideocamOff as VideocamOffIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';

const ChatWindow = ({ onClose, onBack, currentUser }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const { 
    messages,
    sendMessage,
    activeConversation,
    isTyping,
    handleTyping,
    onlineUsers,
    startScreenShare,
    localStream,
    remoteStream,
    screenShareStatus,
    iceConnectionState,
    isScreenShareDialogOpen,
    setIsScreenShareDialogOpen,
    isSharer,
    stopScreenShare,
    joinScreenShare,
    startVideoCall,
    startAudioCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isVideoCallActive,
    isAudioCallActive,
    isVideoCallIncoming,
    isAudioCallIncoming,
    callType,
    callStatus,
    callerId,
    callerName,
    isCallMuted,
    isVideoOff,
    localCallStream,
    remoteCallStream
  } = useChat();
  
  const [inputValue, setInputValue] = useState('');
  const [isRemoteVideoPlaying, setIsRemoteVideoPlaying] = useState(false);
  const [isLocalVideoPlaying, setIsLocalVideoPlaying] = useState(false);
  
  // Reset states when dialog opens/closes
  useEffect(() => {
    if (!isScreenShareDialogOpen) {
      setIsRemoteVideoPlaying(false);
      setIsLocalVideoPlaying(false);
    }
  }, [isScreenShareDialogOpen]);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Dedicated Video View Component for reliability
  const VideoView = ({ stream, isMuted, label, isMaximized, zoomLevel, iceState }) => {
    const videoRef = useRef(null);
    const [hasError, setHasError] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [connectTimeout, setConnectTimeout] = useState(false);

    useEffect(() => {
      let checkInterval;
      
      const timer2 = setTimeout(() => {
          if (!isActive) setConnectTimeout(true);
      }, 15000); // 15 second timeout for diagnostics
      
      const play = async () => {
        const video = videoRef.current;
        if (!video || !stream) return;
        
        try {
          if (video.srcObject !== stream) {
            video.srcObject = stream;
          }
          
          stream.getTracks().forEach(track => {
            console.log("Adding track to PC:", track.kind);
            track.enabled = true; // Explicitly ensure enabled
          });
          
          video.muted = isMuted;
          video.setAttribute('playsinline', 'true');
          video.setAttribute('autoplay', 'true');
          
          await video.play();
          setHasError(false);
          console.log(`[VIDEO] ${label} started playing`);

          // Check for actual video activity
          checkInterval = setInterval(() => {
            if (video.readyState >= 3 && !video.paused) {
                setIsActive(true);
                clearInterval(checkInterval);
            }
          }, 500);

        } catch (err) {
          console.warn(`[VIDEO] ${label} play blocked/failed:`, err);
          setHasError(true);
        }
      };

      const timer = setTimeout(play, 100);
      return () => {
          clearTimeout(timer);
          clearTimeout(timer2);
          if (checkInterval) clearInterval(checkInterval);
      };
    }, [stream, isMuted, label]);

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
        <video 
          ref={videoRef}
          autoPlay 
          muted={isMuted}
          playsInline 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            pointerEvents: isMaximized ? 'auto' : 'none',
            transform: isMaximized ? `scale(${zoomLevel})` : 'none',
            transition: 'transform 0.2s ease-out',
            opacity: isActive ? 1 : 0
          }} 
        />
        
        {!isActive && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', gap: 2, p: 4, textAlign: 'center' }}>
            <CircularProgress size={30} sx={{ color: connectTimeout ? '#ef4444' : '#4ade80' }} />
            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '12px', letterSpacing: 1 }}>
                {label.toUpperCase()} CONNECTION ESTABLISHED...
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {connectTimeout 
                  ? "Taking longer than expected. Possible network restriction/Firewall block." 
                  : "Waiting for video data packets..."}
            </Typography>
            {connectTimeout && (
                <Typography variant="caption" sx={{ color: '#fb923c', mt: 1, fontSize: '10px' }}>
                    Note: If this persists, the TURN relay server might be unreachable or expired.
                </Typography>
            )}
          </Box>
        )}

        {hasError && !isSharer && (
          <Box onClick={() => videoRef.current?.play()} sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' }}>
            <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4, border: '1px solid rgba(255,255,255,0.2)' }}>
                <Typography sx={{ color: 'white', fontWeight: 800, mb: 1 }}>BROWSER BLOCKED AUTOPLAY</Typography>
                <Button size="small" variant="contained" sx={{ bgcolor: '#4ade80', color: '#000', fontWeight: 900, '&:hover': { bgcolor: '#22c55e' } }}>
                    CLICK TO START VIEWING
                </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Screen Share Window Component to be Portaled
  const ScreenSharePortal = () => {
    if (!isScreenShareDialogOpen) return null;
    
    const content = (
      <motion.div
        drag={!isMaximized}
        dragMomentum={false}
        dragElastic={0}
        whileDrag={{ cursor: 'grabbing' }}
        initial={isMaximized ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 50 }}
        animate={isMaximized 
          ? { opacity: 1, scale: 1, x: 0, y: 0, width: '100vw', height: '100vh', top: 0, left: 0, right: 'auto', bottom: 'auto', borderRadius: 0 }
          : { opacity: 1, scale: 1, width: isMobile ? '300px' : '650px', height: isMobile ? '168px' : '365px', top: 60, right: 30, left: 'auto', borderRadius: 16 }
        }
        exit={{ opacity: 0, scale: 0.9 }}
        style={{ 
            position: 'fixed', 
            background: '#000', 
            zIndex: 999999,
            boxShadow: isMaximized ? 'none' : '0 30px 90px rgba(0,0,0,0.7)',
            overflow: 'hidden',
            cursor: isMaximized ? 'default' : 'grab',
            display: 'flex',
            flexDirection: 'column',
            border: isMaximized ? 'none' : '1px solid rgba(255,255,255,0.3)'
        }}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VideoView 
              stream={isSharer ? localStream : remoteStream}
              isMuted={isSharer}
              label={isSharer ? "Local" : "Remote"}
              isMaximized={isMaximized}
              zoomLevel={zoomLevel}
              iceState={iceConnectionState}
            />

            <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)', zIndex: 10, pointerEvents: 'none' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pointerEvents: 'auto' }}>
                    <Box sx={{ bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.4, borderRadius: 1.5, border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
                        <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 'bold', fontSize: '9px', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Box sx={{ width: 6, height: 6, bgcolor: '#4ade80', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                            LIVE • {screenShareStatus.toUpperCase()}
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, pointerEvents: 'auto' }}>
                    {!isMobile && (
                        <IconButton size="small" onClick={() => setIsMaximized(!isMaximized)} sx={{ color: 'white', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}>
                            {isMaximized ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                    )}
                    <IconButton size="small" onClick={() => isSharer ? stopScreenShare(true) : setIsScreenShareDialogOpen(false)} sx={{ color: 'white', bgcolor: 'rgba(239, 68, 68, 0.7)', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.9)' } }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {isMaximized && (
                <Box sx={{ position: 'absolute', bottom: 30, right: 30, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: 'rgba(0,0,0,0.75)', p: 1, borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', pointerEvents: 'auto' }}>
                    <IconButton size="small" onClick={() => setZoomLevel(prev => Math.max(1, prev - 0.25))} sx={{ color: 'white' }}>-</IconButton>
                    <Typography sx={{ color: 'white', fontSize: '13px', fontWeight: 800, minWidth: 40, textAlign: 'center' }}>{Math.round(zoomLevel * 100)}%</Typography>
                    <IconButton size="small" onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))} sx={{ color: 'white' }}>+</IconButton>
                </Box>
            )}

            {isSharer && (
                <Box sx={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
                    <Button 
                        variant="contained" 
                        color="error" 
                        size="small" 
                        startIcon={<StopIcon />}
                        onClick={() => stopScreenShare(true)}
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 900, px: 3, boxShadow: '0 10px 25px rgba(220, 38, 38, 0.4)' }}
                    >
                        Stop Sharing
                    </Button>
                </Box>
            )}

        </Box>
        <style>{`@keyframes pulse { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }`}</style>
      </motion.div>
    );

    return ReactDOM.createPortal(content, document.body);
  };

  // Simplified playback logic - REMOVED redundant logic, now handled by VideoView component


  // Simplified playback logic - REMOVED redundant logic, now handled by VideoView component

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeConversation?.initialMessage) {
        setInputValue(activeConversation.initialMessage);
        activeConversation.initialMessage = null; 
    }
  }, [activeConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue);
    setInputValue('');
    handleTyping(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const onInputChange = (e) => {
    setInputValue(e.target.value);
    handleTyping(e.target.value.length > 0);
  };

  if (!activeConversation && !messages.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0}
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        width: '100%',
        borderRadius: 0,
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        border: 'none',
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: '16px 20px', 
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
        zIndex: 10
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {onBack && (
            <IconButton size="small" onClick={onBack} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, width: 36, height: 36 }}>
              <BackIcon sx={{ fontSize: '1.2rem' }} />
            </IconButton>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot" sx={{ '& .MuiBadge-badge': { backgroundColor: onlineUsers.has(String(activeConversation.user_id === String(currentUser?.id) ? activeConversation.expert_id : activeConversation.user_id)) ? '#22c55e' : '#94a3b8', boxShadow: '0 0 0 2px #fff' } }}>
              <Avatar src={activeConversation?.profile_image} sx={{ width: 44, height: 44, border: '2px solid rgba(255,255,255,0.4)' }}>
                {activeConversation?.other_party_name?.charAt(0)}
              </Avatar>
            </Badge>
            <Box sx={{ ml: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.1, fontSize: '0.95rem' }}>
                {activeConversation?.type === 'broadcast' ? activeConversation.title : (activeConversation?.other_party_name || "Expert Support")}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 500, fontSize: '0.7rem' }}>
                {activeConversation?.type === 'broadcast' ? 'Broadcast Channel' : (isTyping ? 'Typing...' : 'Live Chat')}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {activeConversation?.type !== 'broadcast' && (
            <>
              <Tooltip title="Audio Call">
                <IconButton size="small" onClick={startAudioCall} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, width: 32, height: 32, mr: 0.5 }}>
                  <CallIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Video Call">
                <IconButton size="small" onClick={startVideoCall} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, width: 32, height: 32, mr: 0.5 }}>
                  <VideocamIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share Screen">
                <IconButton size="small" onClick={startScreenShare} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, width: 32, height: 32, mr: 0.5 }}>
                  <ScreenShareIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          <IconButton size="small" onClick={onClose} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2, backgroundColor: '#f8fafc' }}>
        {messages.map((msg, idx) => {
            const isMe = String(msg.sender_id) === String(currentUser?.id || currentUser?.user_id);
            return (
              <Box key={idx} sx={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
                <Paper sx={{ p: 1.5, px: 2, borderRadius: 3, bgcolor: isMe ? '#8b5cf6' : 'white', color: isMe ? 'white' : 'inherit', border: isMe ? 'none' : '1px solid #e2e8f0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                  {!isMe && activeConversation?.type === 'broadcast' && (
                      <Typography variant="caption" sx={{ color: '#f59e0b', fontWeight: 900, mb: 0.5, display: 'block', fontSize: '0.65rem' }}>
                          EXPERT • {activeConversation.other_party_name}
                      </Typography>
                  )}
                  <Typography variant="body2">{msg.message}</Typography>
                  
                  {/* Join buttons for different call types */}
                  {msg.message.includes('💻') && !isMe && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={joinScreenShare} 
                        sx={{ mt: 1, bgcolor: isMe ? 'rgba(255,255,255,0.2)' : '#8b5cf6', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700 }}
                      >
                        Join Screen
                      </Button>
                  )}
                  {msg.message.includes('📹') && !isMe && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={acceptCall} 
                        sx={{ mt: 1, bgcolor: isMe ? 'rgba(255,255,255,0.2)' : '#8b5cf6', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, boxShadow: '0 4px 10px rgba(139,92,246,0.4)' }}
                      >
                        Join Video Call
                      </Button>
                  )}
                  {msg.message.includes('📞') && !isMe && (
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={acceptCall} 
                        sx={{ mt: 1, bgcolor: isMe ? 'rgba(255,255,255,0.2)' : '#22c55e', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, boxShadow: '0 4px 10px rgba(34,197,94,0.4)' }}
                      >
                        Join Audio Call
                      </Button>
                  )}
                </Paper>
                <Typography variant="caption" sx={{ mt: 0.5, display: 'block', px: 1, color: 'text.secondary', fontSize: '10px' }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
              </Box>
            );
        })}
        {isTyping && <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic', ml: 1 }}>Someone is typing...</Typography>}
        <div ref={messagesEndRef} />
      </Box>

      {/* Smart Input Area */}
      <Box sx={{ 
        p: 2, 
        bgcolor: 'white', 
        borderTop: '1px solid #e2e8f0' 
      }}>
        {activeConversation?.type === 'broadcast' && currentUser?.role !== 'expert' ? (
            <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#f8fafc', borderRadius: 4, border: '1px dashed #cbd5e1' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
                    This is a broadcast channel. Only experts can send messages here.
                </Typography>
            </Box>
        ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: '#f1f5f9', p: '2px 8px', borderRadius: 10 }}>
                {activeConversation?.type !== 'broadcast' && (
                    <>
                        <Tooltip title="Audio Call"><IconButton size="small" onClick={startAudioCall} sx={{ color: '#8b5cf6' }}><CallIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Video Call"><IconButton size="small" onClick={startVideoCall} sx={{ color: '#8b5cf6' }}><VideocamIcon fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Share Screen"><IconButton size="small" onClick={startScreenShare} sx={{ color: '#10b981' }}><ScreenShareIcon fontSize="small" /></IconButton></Tooltip>
                    </>
                )}
                <TextField 
                    fullWidth 
                    variant="standard" 
                    placeholder="Type a message..." 
                    value={inputValue} 
                    onChange={onInputChange} 
                    onKeyPress={handleKeyPress}
                    InputProps={{ disableUnderline: true, sx: { px: 1, fontSize: '0.9rem' } }}
                />
                <IconButton onClick={handleSend} disabled={!inputValue.trim()} sx={{ color: '#8b5cf6' }}><SendIcon /></IconButton>
            </Box>
        )}
      </Box>

      {/* Render Screen Share via Portal (Breaks out of container) */}
      <ScreenSharePortal />

    </Paper>
  );
};

export default ChatWindow;
