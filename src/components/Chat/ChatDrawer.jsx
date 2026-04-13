import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  Fab, 
  Badge,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  Message as MessageIcon,
  Chat as ChatIcon,
  ChevronRight as ChevronRightIcon,
  Call as CallIcon,
  Videocam as VideocamIcon,
  Mic as MicIcon,
  MicOff as MicOffIcon,
  CallEnd as CallEndIcon,
  VideocamOff as VideocamOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Close as CloseIcon,
  ScreenShare as ScreenShareIcon,
  Stop as StopIcon
} from '@mui/icons-material';
import { 
  Dialog, 
  DialogContent, 
  Avatar as MuiAvatar, 
  CircularProgress 
} from '@mui/material';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import CreditPlansDialog from './CreditPlansDialog';

// ── Incoming Call Portal ── renders OUTSIDE the Drawer so it always shows ──
const IncomingCallPortal = () => {
  const {
    isVideoCallIncoming,
    isAudioCallIncoming,
    callType,
    callerName,
    acceptCall,
    rejectCall,
    setIsChatOpen,
  } = useChat();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  const isOpen = isVideoCallIncoming || isAudioCallIncoming;
  if (!isOpen) return null;

  const content = (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box
        sx={{
          bgcolor: '#1e1b4b',
          borderRadius: 5,
          p: 4,
          minWidth: 300,
          maxWidth: 360,
          textAlign: 'center',
          border: '1px solid rgba(139,92,246,0.4)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Pulsing Avatar */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
          <Box
            sx={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '3px solid',
              borderColor: callType === 'video' ? '#8b5cf6' : '#22c55e',
              animation: 'callPulse 1.4s ease-out infinite',
              '@keyframes callPulse': {
                '0%': { transform: 'scale(1)', opacity: 0.8 },
                '100%': { transform: 'scale(1.5)', opacity: 0 },
              },
            }}
          />
          <MuiAvatar
            sx={{
              width: 88,
              height: 88,
              bgcolor: callType === 'video' ? '#7c3aed' : '#16a34a',
              fontSize: '2.5rem',
              border: '3px solid rgba(255,255,255,0.2)',
            }}
          >
            {callerName?.charAt(0) || 'U'}
          </MuiAvatar>
        </Box>

        <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>
          {callerName || 'Someone'}
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mb: 3 }}>
          {callType === 'video' ? '🎥 Incoming Video Call...' : '📞 Incoming Audio Call...'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
          {/* Decline */}
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={rejectCall}
              sx={{
                bgcolor: '#ef4444',
                color: 'white',
                width: 62,
                height: 62,
                '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.05)' },
                transition: 'all 0.2s',
                boxShadow: '0 8px 20px rgba(239,68,68,0.5)',
              }}
            >
              <CallEndIcon sx={{ fontSize: '1.8rem' }} />
            </IconButton>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.5)' }}>Decline</Typography>
          </Box>

          {/* Accept */}
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={() => {
                if (isMobile) setIsChatOpen(true);
                acceptCall();
              }}
              sx={{
                bgcolor: '#22c55e',
                color: 'white',
                width: 62,
                height: 62,
                '&:hover': { bgcolor: '#16a34a', transform: 'scale(1.05)' },
                transition: 'all 0.2s',
                boxShadow: '0 8px 20px rgba(34,197,94,0.5)',
                animation: 'acceptGlow 1s ease-in-out infinite alternate',
                '@keyframes acceptGlow': {
                  '0%': { boxShadow: '0 8px 20px rgba(34,197,94,0.5)' },
                  '100%': { boxShadow: '0 8px 35px rgba(34,197,94,0.9)' },
                },
              }}
            >
              {callType === 'video' ? <VideocamIcon sx={{ fontSize: '1.8rem' }} /> : <CallIcon sx={{ fontSize: '1.8rem' }} />}
            </IconButton>
            <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'rgba(255,255,255,0.5)' }}>Accept</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return ReactDOM.createPortal(content, document.body);
};

const ChatDrawer = ({ currentUser }) => {
  const { 
    unreadCount, 
    activeConversation, 
    setActiveConversation, 
    isCreditDialogOpen, 
    setIsCreditDialogOpen,
    creditDialogExpertId,
    isChatOpen,
    setIsChatOpen,
    // Video/Audio Calling
    isVideoCallActive,
    isAudioCallActive,
    isVideoCallIncoming,
    isAudioCallIncoming,
    callType,
    callStatus,
    callerId,
    callerName,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
    isCallMuted,
    isVideoOff,
    localCallStream,
    remoteCallStream
  } = useChat();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setIsChatOpen(open);
  };

  useEffect(() => {
    if (activeConversation) {
      setIsChatOpen(true);
    }
  }, [activeConversation, setIsChatOpen]);

  const handleBackToList = () => {
    setActiveConversation(null);
  };

  return (
    <>
      {/* Premium Floating Action Button */}
      <AnimatePresence>
        {!isChatOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1100 }}
          >
            <Fab 
              color="primary" 
              aria-label="chat" 
              onClick={() => setIsChatOpen(true)}
              sx={{ 
                width: 64,
                height: 64,
                background: '#8b5cf6',
                color: 'white',
                '&:hover': { 
                  background: '#7c3aed',
                  transform: 'scale(1.1)',
                  boxShadow: '0 12px 30px rgba(139, 92, 246, 0.5)' 
                },
                boxShadow: '0 8px 25px rgba(139, 92, 246, 0.4)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            >
              <Badge 
                badgeContent={unreadCount} 
                color="error"
                sx={{ '& .MuiBadge-badge': { height: 22, minWidth: 22, borderRadius: '50%', fontWeight: 700, border: '2px solid #8b5cf6' } }}
              >
                <ChatIcon sx={{ fontSize: '1.8rem' }} />
              </Badge>
            </Fab>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern Slide-out Drawer */}
      <Drawer
        anchor="right"
        open={isChatOpen}
        onClose={toggleDrawer(false)}
        elevation={0}
        PaperProps={{
          sx: {
            width: isMobile ? '100vw' : 420,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: '#f8fafc',
            borderLeft: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '-20px 0 60px rgba(0,0,0,0.1)'
          }
        }}
      >
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {activeConversation ? (
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <ChatWindow 
                onClose={() => setIsChatOpen(false)} 
                onBack={handleBackToList}
                currentUser={currentUser} 
              />
            </Box>
          ) : (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 4, 
                background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', 
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                    Messages
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: '20px', 
                    display: 'inline-block',
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {unreadCount > 0 ? `${unreadCount} New Messages` : 'Inbox Clean'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton onClick={() => setIsChatOpen(false)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}>
                  <ChevronRightIcon />
                </IconButton>
              </Box>
              
              <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
                <ChatList />
              </Box>
            </Box>
          )}
        </Box>
      </Drawer>

      <CreditPlansDialog 
        open={isCreditDialogOpen} 
        onClose={() => setIsCreditDialogOpen(false)} 
        userId={currentUser?.id || currentUser?.user_id}
        expertId={creditDialogExpertId}
      />

      {/* Global Call Overlay (active call screen) */}
      <CallOverlay />

      {/* Global Incoming Call — rendered via Portal, always on top */}
      <IncomingCallPortal />
    </>
  );
};

// Internal components for Call UI relocated from ChatWindow
const VideoView = ({ stream, isMuted, label, isMaximized, iceState }) => {
  const videoRef = React.useRef(null);
  const [isActive, setIsActive] = React.useState(false);

  React.useEffect(() => {
    let checkInterval;
    const play = async () => {
      const video = videoRef.current;
      if (!video || !stream) return;
      try {
        if (video.srcObject !== stream) video.srcObject = stream;
        video.muted = isMuted;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        await video.play();
        checkInterval = setInterval(() => {
          if (video.readyState >= 3 && !video.paused) {
            setIsActive(true);
            clearInterval(checkInterval);
          }
        }, 500);
      } catch (err) { console.warn(`[VIDEO] ${label} play blocked:`, err); }
    };
    play();
    return () => { if (checkInterval) clearInterval(checkInterval); };
  }, [stream, isMuted, label]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#000' }}>
      <video ref={videoRef} autoPlay muted={isMuted} playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: isActive ? 1 : 0 }} />
      {!isActive && (
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: '#000', gap: 2 }}>
          <CircularProgress size={30} sx={{ color: '#4ade80' }} />
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '12px' }}>CONNECTING...</Typography>
        </Box>
      )}
    </Box>
  );
};

const CallOverlay = () => {
  const { isVideoCallActive, isAudioCallActive, remoteCallStream, localCallStream, callType, callStatus, callerName, endCall, toggleMute, toggleVideo, isCallMuted, isVideoOff, activeConversation } = useChat();
  if (!isVideoCallActive && !isAudioCallActive) return null;
  const isVideo = isVideoCallActive;

  const content = (
    <Box sx={{ position: 'fixed', inset: 0, bgcolor: '#000', zIndex: 99999998, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {isVideo ? (
        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Remote video - full screen */}
          <VideoView stream={remoteCallStream} isMuted={false} label="Remote" isMaximized={true} />
          
          {/* Local video - picture-in-picture */}
          <Box sx={{
            position: 'absolute',
            bottom: 120,
            right: 20,
            width: 130,
            height: 180,
            bgcolor: '#111',
            borderRadius: 3,
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 10
          }}>
            <video
              autoPlay
              muted
              playsInline
              ref={(el) => { if (el && localCallStream) el.srcObject = localCallStream; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>

          {/* Status badge */}
          <Box sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', bgcolor: 'rgba(0,0,0,0.6)', px: 2, py: 0.7, borderRadius: 10, backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, bgcolor: callStatus === 'connected' ? '#22c55e' : '#f59e0b', borderRadius: '50%', animation: 'blink 1s infinite', '@keyframes blink': { '50%': { opacity: 0 } } }} />
            <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>
              {callStatus === 'connected' ? 'CONNECTED' : 'CONNECTING...'}
            </Typography>
          </Box>
        </Box>
      ) : (
        /* Audio call UI */
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', width: '100%', height: '100%', justifyContent: 'center' }}>
          <Box sx={{ position: 'relative' }}>
            {callStatus !== 'connected' && (
              <Box sx={{ position: 'absolute', inset: -16, borderRadius: '50%', border: '3px solid #6366f1', animation: 'audioRing 1.5s ease-out infinite', '@keyframes audioRing': { '0%': { transform: 'scale(1)', opacity: 0.8 }, '100%': { transform: 'scale(1.5)', opacity: 0 } } }} />
            )}
            <MuiAvatar sx={{ width: 130, height: 130, bgcolor: '#4f46e5', fontSize: '3.5rem', border: '4px solid rgba(255,255,255,0.15)' }}>
              {callerName?.charAt(0) || activeConversation?.other_party_name?.charAt(0) || 'U'}
            </MuiAvatar>
          </Box>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>{callerName || activeConversation?.other_party_name}</Typography>
          <Typography sx={{ color: callStatus === 'connected' ? '#4ade80' : '#fbbf24', fontWeight: 600, fontSize: '1rem' }}>
            {callStatus === 'connected' ? '🟢 Session Live' : '🔔 Connecting...'}
          </Typography>
          <audio autoPlay ref={(el) => { if (el && remoteCallStream) el.srcObject = remoteCallStream; }} />
        </Box>
      )}

      {/* Controls bar */}
      <Box sx={{
        position: 'absolute',
        bottom: 40,
        display: 'flex',
        gap: 2.5,
        alignItems: 'center',
        bgcolor: 'rgba(0,0,0,0.65)',
        p: { xs: 1.5, sm: 2 },
        px: { xs: 2.5, sm: 4 },
        borderRadius: 20,
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}>
        {/* Mute */}
        <Box sx={{ textAlign: 'center' }}>
          <IconButton
            onClick={toggleMute}
            sx={{ color: 'white', bgcolor: isCallMuted ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.15)', width: 52, height: 52, '&:hover': { bgcolor: isCallMuted ? '#ef4444' : 'rgba(255,255,255,0.25)' } }}
          >
            {isCallMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.5)', mt: 0.5, fontSize: '10px' }}>
            {isCallMuted ? 'Unmute' : 'Mute'}
          </Typography>
        </Box>

        {/* Video toggle - only for video calls */}
        {isVideo && (
          <Box sx={{ textAlign: 'center' }}>
            <IconButton
              onClick={toggleVideo}
              sx={{ color: 'white', bgcolor: isVideoOff ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.15)', width: 52, height: 52, '&:hover': { bgcolor: isVideoOff ? '#ef4444' : 'rgba(255,255,255,0.25)' } }}
            >
              {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
            </IconButton>
            <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.5)', mt: 0.5, fontSize: '10px' }}>
              {isVideoOff ? 'Start Video' : 'Stop Video'}
            </Typography>
          </Box>
        )}

        {/* End Call */}
        <Box sx={{ textAlign: 'center' }}>
          <IconButton
            onClick={() => endCall(true)}
            sx={{ color: 'white', bgcolor: '#ef4444', width: 62, height: 62, '&:hover': { bgcolor: '#dc2626', transform: 'scale(1.05)' }, boxShadow: '0 8px 20px rgba(239,68,68,0.5)', transition: 'all 0.2s' }}
          >
            <CallEndIcon sx={{ fontSize: '1.8rem' }} />
          </IconButton>
          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.5)', mt: 0.5, fontSize: '10px' }}>End Call</Typography>
        </Box>
      </Box>
    </Box>
  );
  return ReactDOM.createPortal(content, document.body);
};

export default ChatDrawer;
