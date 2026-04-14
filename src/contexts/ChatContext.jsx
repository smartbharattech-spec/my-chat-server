import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../services/ToastService';

const ChatContext = createContext();

import { SOCKET_URL } from '../utils/config';

export const ChatProvider = ({ children, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [isCreditDialogOpen, setIsCreditDialogOpen] = useState(false);
  const [creditDialogExpertId, setCreditDialogExpertId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Screen Sharing States
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isScreenShareDialogOpen, setIsScreenShareDialogOpen] = useState(false);
  const [isSharer, setIsSharer] = useState(false);
  const [pendingOffer, setPendingOffer] = useState(null);
  const [sharingWithId, setSharingWithId] = useState(null);
  const [screenShareStatus, setScreenShareStatus] = useState("idle"); // idle, starting, checking, connected, disconnected, failed
  const [iceConnectionState, setIceConnectionState] = useState("new");
  const iceCandidatesReceived = useRef([]);
  const candidatesQueue = useRef([]);
  const pcRef = useRef(null);
  const { showToast } = useToast();

  // Video Calling States
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isVideoCallIncoming, setIsVideoCallIncoming] = useState(false);
  const [isAudioCallActive, setIsAudioCallActive] = useState(false);
  const [isAudioCallIncoming, setIsAudioCallIncoming] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' | 'audio' | null
  const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, connecting, connected, ended
  const [callerId, setCallerId] = useState(null);
  const [callerName, setCallerName] = useState(null);
  const [isCallMuted, setIsCallMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localCallStream, setLocalCallStream] = useState(null);
  const [remoteCallStream, setRemoteCallStream] = useState(null);
  const callPcRef = useRef(null);
  const callCandidatesQueue = useRef([]);
  const callPendingOffer = useRef(null);
  const ringtoneRef = useRef(null);
  const titleBlinkIntervalRef = useRef(null);
  
  // Create all refs at the very top for stability
  const activeConversationIdRef = useRef(null);
  const activeConversationRef = useRef(null);
  const currentId = currentUser?.id || currentUser?.user_id;

  // Sync refs with state immediately on every render
  activeConversationIdRef.current = activeConversation?.id;
  activeConversationRef.current = activeConversation;

  useEffect(() => {
    if (currentId) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      let userRole = currentUser.role || (currentUser.expert_id ? 'expert' : 'user');
      
      // Fallback role inference
      if (!currentUser.role && localStorage.getItem('occult_user')) {
        const stored = JSON.parse(localStorage.getItem('occult_user'));
        if (String(stored.id) === String(currentId) || String(stored.user_id) === String(currentId)) userRole = stored.role;
      }

      newSocket.emit('join', { userId: String(currentId), role: userRole });

      newSocket.on('receive_message', (data) => {
        const activeId = activeConversationIdRef.current;
        const activeConv = activeConversationRef.current;

        // MATCHING LOGIC: Check ID first, then parties if ID is missing (started from dashboard)
        const isMatch = (activeId && String(data.conversation_id) === String(activeId)) || 
                       (!activeId && activeConv && (
                          String(data.sender_id) === String(activeConv.expert_id) || 
                          String(data.sender_id) === String(activeConv.user_id)
                       ));

        if (isMatch) {
          if (!activeId && data.conversation_id) {
            setActiveConversation(prev => ({ ...prev, id: data.conversation_id }));
          }
          
          setMessages((prev) => {
            // Prevent duplicate messages
            const exists = prev.some(m => 
              (m.id && m.id === data.id) || 
              (m.message === data.message && m.sender_id === data.sender_id && Math.abs(new Date(m.created_at) - new Date(data.created_at)) < 5000)
            );
            return exists ? prev : [...prev, data];
          });
          
        }
        
        fetchConversations();
        
        if (String(data.sender_id) !== String(currentId)) {
          showToast(`New message from ${data.senderName || data.sender_name || "Expert"}`, "info");
          try { new Audio('/assets/sounds/message.mp3').play().catch(() => {}); } catch(e) {}
        }
      });

      newSocket.on('user_typing', (data) => {
        if (String(data.conversation_id || data.conversationId) === String(activeConversationIdRef.current)) {
          setIsTyping(data.isTyping);
        }
      });

      newSocket.on('status_update', (data) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev);
          if (data.isOnline) next.add(String(data.userId));
          else next.delete(String(data.userId));
          return next;
        });
      });

      newSocket.on('initial_online_users', (userList) => {
        setOnlineUsers(new Set(userList.map(String)));
      });

      // WebRTC Signaling Handlers (Screen Share)
      newSocket.on('screenshare_offer', async (data) => {
        console.log("[MS-1] Received screenshare offer from:", data.senderId);
        if (String(data.receiverId) === String(currentId)) {
          console.log("[MS-2] Target ID matched. Setting pending offer...");
          setPendingOffer({ offer: data.offer, senderId: data.senderId });
          showToast(`${activeConversation?.other_party_name || "Expert"} is sharing their screen. Click Join Now!`, "info");
        }
      });

      newSocket.on('screenshare_answer', async (data) => {
          if (String(data.receiverId) === String(currentId)) {
              if (pcRef.current) {
                  try {
                      console.log("[MS-ANSWER] Received answer, setting remote description...");
                      showToast("Connection handshake received! Establishing video link...", "info");
                      await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                      setScreenShareStatus("connecting");
                      
                      if (candidatesQueue.current.length > 0) {
                          console.log(`[MS-ICE] Processing ${candidatesQueue.current.length} queued candidates after answer...`);
                          for (const candidate of candidatesQueue.current) {
                              try {
                                  await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
                              } catch (e) {
                                  console.warn("Adding queued candidate failed after answer:", e);
                              }
                          }
                          candidatesQueue.current = [];
                      }
                  } catch (err) {
                      console.error("Error setting remote description from answer:", err);
                      setScreenShareStatus("failed");
                  }
              }
          }
      });

      newSocket.on('screenshare_candidate', async (data) => {
          if (String(data.receiverId) === String(currentId)) {
              if (pcRef.current && pcRef.current.remoteDescription) {
                  try {
                      await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
                  } catch (e) {
                      console.warn("Error adding received ice candidate", e);
                  }
              } else {
                  console.log("[MS-ICE] PC not ready or remoteDesc missing, queueing candidate...");
                  candidatesQueue.current.push(data.candidate);
              }
          }
      });

      newSocket.on('screenshare_stop', (data) => {
          if (data.receiverId === String(currentId)) {
              stopScreenShare(false);
          }
      });

      // ─── Video/Audio Call Signaling ───────────────────────────────────
        newSocket.on('call_offer', async (data) => {
          if (String(data.receiverId) !== String(currentId)) return;
          callPendingOffer.current = { offer: data.offer, senderId: data.senderId };
          setCallType(data.callType);
          setCallerId(data.senderId);
          setCallerName(data.callerName || 'Unknown');
          
          if (data.callType === 'video') setIsVideoCallIncoming(true);
          else setIsAudioCallIncoming(true);
          setCallStatus('ringing');

          // Play ringtone
          const playRingtone = () => {
            try {
              const audio = new Audio('/assets/sounds/ringtone.mp3');
              audio.loop = true;
              audio.play().catch(() => {
                  console.warn("Ringtone could not play. Check if '/assets/sounds/ringtone.mp3' exists.");
              });
              ringtoneRef.current = audio;
            } catch(e) { console.warn("Audio creation failed", e); }
          };
          playRingtone();

          // Blink tab title
          const originalTitle = document.title;
          if (titleBlinkIntervalRef.current) clearInterval(titleBlinkIntervalRef.current);
          
          titleBlinkIntervalRef.current = setInterval(() => {
              document.title = document.title === originalTitle 
                ? `📞 INCOMING ${data.callType.toUpperCase()}...` 
                : originalTitle;
          }, 800);
          
          showToast(`🔔 INCOMING ${data.callType.toUpperCase()} CALL FROM: ${data.callerName || 'Someone'}`, 'info');
        });

      newSocket.on('call_answer', async (data) => {
        if (String(data.receiverId) !== String(currentId)) return;
        if (callPcRef.current) {
          try {
            await callPcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
            setCallStatus('connected');
            if (callCandidatesQueue.current.length > 0) {
              for (const c of callCandidatesQueue.current) {
                try { await callPcRef.current.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
              }
              callCandidatesQueue.current = [];
            }
          } catch(err) { console.error('call_answer error:', err); }
        }
      });

      newSocket.on('call_candidate', async (data) => {
        if (String(data.receiverId) !== String(currentId)) return;
        if (callPcRef.current && callPcRef.current.remoteDescription) {
          try { await callPcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch(e) {}
        } else {
          callCandidatesQueue.current.push(data.candidate);
        }
      });

      newSocket.on('call_end', (data) => {
        if (String(data.receiverId) === String(currentId)) {
          endCall(false);
          showToast('Call ended by other party', 'info');
        }
      });

      newSocket.on('call_rejected', (data) => {
        if (String(data.receiverId) === String(currentId)) {
          endCall(false);
          showToast('Call was declined', 'warning');
        }
      });

      newSocket.on('request_call_offer', (data) => {
        if (String(data.receiverId) === String(currentId)) {
          console.log("[CALL] Received request_call_offer. Re-sending offer...");
          if (callPcRef.current && callPcRef.current.localDescription) {
            newSocket.emit('call_offer', {
              offer: callPcRef.current.localDescription,
              receiverId: String(data.senderId),
              senderId: String(currentId),
              callType: isVideoCallActive ? 'video' : 'audio',
              callerName: currentUser?.name || 'Expert'
            });
          }
        }
      });

      fetchConversations();
      return () => newSocket.close();
    }
  }, [currentId]);

  useEffect(() => {
    if (activeConversation?.id) {
      fetchMessages(activeConversation.id);
    } else if (activeConversation && (activeConversation.expert_id || activeConversation.user_id)) {
      const otherId = activeConversation.expert_id || activeConversation.user_id;
      const existing = conversations.find(c => 
          (String(c.user_id) === String(otherId) || String(c.expert_id) === String(otherId)) &&
          c.id
      );
      if (existing) {
        setActiveConversation(existing);
      } else {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [activeConversation?.id]); // Trigger ONLY on ID change

  useEffect(() => {
    if (socket && currentId) {
      console.log("Syncing socket room for user:", currentId);
      socket.emit('join', { userId: String(currentId) });
    }
  }, [socket, currentId]);

  const fetchConversations = async () => {
    const currentId = currentUser?.id || currentUser?.user_id;
    const userRole = currentUser?.role || (currentUser?.expert_id ? 'expert' : 'user');

    try {
      const response = await fetch("/api/marketplace/chat_get_conversations.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentId, role: userRole })
      });
      const result = await response.json();
      if (result.status === 'success') {
        setConversations(result.data);
        const totalUnread = result.data.reduce((sum, conv) => sum + conv.unread_count, 0);
        setUnreadCount(totalUnread);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId) => {
    const currentId = currentUser?.id || currentUser?.user_id;
    try {
      const response = await fetch("/api/marketplace/chat_get_messages.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, user_id: currentId })
      });
      const result = await response.json();
      if (result.status === 'success' && Array.isArray(result.data)) {
        setMessages(result.data);
        fetchConversations();
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async (messageText, fileUrl = null, expertId = null) => {
    if (!messageText.trim() && !fileUrl) return;

    try {
      if (!currentUser) {
        console.error('sendMessage error: currentUser is null');
        showToast('Please login to send messages', 'error');
        return;
      }
      const currentId = currentUser.id || currentUser.user_id;
      const payload = {
        user_id: currentId,
        message: messageText,
        file_url: fileUrl
      };

      if (activeConversation) {
        payload.conversation_id = activeConversation.id;
        // Robust receiver ID determination
        const currentUid = String(currentId);
        const convUid = String(activeConversation.user_id);
        const convEid = String(activeConversation.expert_id);
        
        payload.receiverId = convUid === currentUid ? convEid : convUid;
        
        // Final fallback
        if (!payload.receiverId || payload.receiverId === 'undefined') {
          payload.receiverId = activeConversation.expert_id || activeConversation.user_id;
        }

        if (!activeConversation.id && activeConversation.expert_id) {
          payload.expert_id = activeConversation.expert_id;
        }
      } else if (expertId) {
        payload.expert_id = expertId;
        payload.receiverId = expertId;
      }

      const response = await fetch("/api/marketplace/chat_send_message.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.status === 'success') {
        const newMessage = {
          conversation_id: result.data.conversation_id,
          sender_id: currentId,
          message: messageText,
          file_path: fileUrl,
          created_at: result.data.created_at
        };

        // Emit via socket
        socket.emit('send_message', {
          ...newMessage,
          receiverId: payload.receiverId,
          senderName: currentUser.name || "User"
        });

        if (String(activeConversation?.id) === String(result.data.conversation_id)) {
          setMessages((prev) => [...prev, newMessage]);
        } else if (!activeConversation?.id) {
          // If this was a new conversation, update activeConversation with the real ID
          setActiveConversation(prev => ({ ...prev, id: result.data.conversation_id }));
          setMessages([newMessage]);
          fetchConversations();
        } else {
          fetchConversations();
        }
      } else if (result.status === 'error') {
        if (result.message && result.message.toLowerCase().includes('insufficient credits')) {
          // Capture the expert_id from the active conversation at the moment of failure
          const currentConv = activeConversationRef.current;
          const currentUid = String(currentId);
          const convUid = String(currentConv?.user_id);
          const expertId = convUid === currentUid ? currentConv?.expert_id : currentConv?.user_id;
          setCreditDialogExpertId(expertId || null);
          setIsCreditDialogOpen(true);
        } else {
          showToast(result.message || 'Failed to send message', 'error');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Connection error. Please try again.', 'error');
    }
  };

  const sendFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch("/api/marketplace/chat_upload_file.php", {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      if (result.status === 'success') {
        await sendMessage("", result.data.file_url);
      } else {
        showToast(result.message || "Failed to upload file", "error");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      showToast("Upload failed", "error");
    }
  };

  const updateConversationTitle = async (conversationId, newTitle) => {
    const currentId = currentUser?.id || currentUser?.user_id;
    try {
      const response = await fetch("/api/marketplace/chat_update_conversation.php", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversationId, user_id: currentId, title: newTitle })
      });
      const result = await response.json();
      if (result.status === 'success') {
        showToast("Group renamed successfully!", "success");
        if (activeConversation?.id === conversationId) {
          setActiveConversation(prev => ({ ...prev, title: newTitle }));
        }
        fetchConversations();
      } else {
        showToast(result.message || "Failed to rename group", "error");
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };
  
  const handleTyping = (isTypingStatus) => {
    if (!activeConversation || !socket) return;
    const receiverId = activeConversation.user_id === currentUser.id ? activeConversation.expert_id : activeConversation.user_id;
    socket.emit('typing', {
      receiverId,
      senderId: currentUser.id,
      conversationId: activeConversation.id,
      isTyping: isTypingStatus
    });
  };
  
  const startScreenShare = async () => {
    if (!activeConversation || !socket) {
        showToast('Please select a conversation first', 'error');
        return;
    }
    
    try {
        // Emit for signalling
        const receiverId = activeConversation.user_id === currentId ? activeConversation.expert_id : activeConversation.user_id;
        socket.emit('screen_share_request', {
            senderId: currentId,
            receiverId,
            conversationId: activeConversation.id,
            timestamp: new Date()
        });
        
        showToast("Screen sharing request sent to " + activeConversation.other_party_name, "success");
        
        // Notify via a message in the chat
        sendMessage("💻 Requested to share screen. Click to join/view.");
        
        await initiateWebRTCShare();
    } catch (error) {
        showToast("Screen sharing error", "error");
        console.error(error);
    }
  };

  const createPeerConnection = (otherUserId) => {
    console.log("--- Creating New RTCPeerConnection for:", otherUserId, "---");
    const pc = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.services.mozilla.com' },
            { 
              urls: 'turn:global.relay.metered.ca:443',
              username: 'c7a41d90bb86493de1abadff', 
              credential: 'j7fgmXMsNM1sBNcd' 
            },
            { 
              urls: 'turn:global.relay.metered.ca:443?transport=tcp',
              username: 'c7a41d90bb86493de1abadff', 
              credential: 'j7fgmXMsNM1sBNcd' 
            }
        ],
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        iceCandidatePoolSize: 10,
        sdpSemantics: 'unified-plan'
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            console.log(`[ICE-GEN] New Candidate (${event.candidate.type}):`, event.candidate.candidate.substring(0, 50) + "...");
            socket.emit('screenshare_candidate', {
                candidate: event.candidate,
                receiverId: String(otherUserId),
                senderId: String(currentId)
            });
        }
    };

    pc.ontrack = (event) => {
        console.log("[MS-8] Remote Track Received:", event.track.kind, "Stream ID:", event.streams[0]?.id || "none");
        if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
            console.log("[MS-9] Remote stream set from event.streams[0]");
        } else {
            console.log("[MS-ST] Manual stream creation from track");
            const newStream = new MediaStream([event.track]);
            setRemoteStream(newStream);
        }
    };

    pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        console.log(`[ICE-STATE] Connection State Change: %c${state.toUpperCase()}`, "color: #818cf8; font-weight: bold");
        setScreenShareStatus(state);
        setIceConnectionState(state);
        
        if (state === 'failed' || state === 'closed') {
            console.error(`[ICE-ERROR] Connection ${state}. Cleaning up...`);
            stopScreenShare(false);
        }
    };

    pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        console.log(`[PC-STATE] PeerConnection State: %c${state.toUpperCase()}`, "color: #10b981; font-weight: bold");
        if (state === 'connected') {
            setScreenShareStatus("connected");
            showToast("Video Connection established!", "success");
        }
        if (state === 'failed') {
            showToast("Video connection failed. Check your network or firewall.", "error");
        }
    };

    pcRef.current = pc;
    return pc;
  };

  const initiateWebRTCShare = async () => {
    try {
        console.log("--- Requesting Screen Share Stream ---");
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
                cursor: "always",
                displaySurface: "monitor",
                frameRate: { max: 15 }
            },
            audio: false 
        });
        
        if (!stream || stream.getTracks().length === 0) {
            throw new Error("No video tracks obtained from screen share.");
        }

        console.log("[MS-3] Video stream obtained from navigator.mediaDevices.getDisplayMedia");
        console.log("Stream ID:", stream.id);
        setLocalStream(stream);
        setIsSharer(true);
        setIsScreenShareDialogOpen(true);

        // Robustly identify the other party's ID
        let receiverId = null;
        const currentIdStr = String(currentId);
        
        if (activeConversation) {
            const convUserId = String(activeConversation.user_id);
            const convExpertId = String(activeConversation.expert_id);
            
            // If I am the user in this conversation, target the expert
            if (convUserId === currentIdStr) {
                receiverId = convExpertId;
            } 
            // If I am the expert in this conversation, target the user
            else if (convExpertId === currentIdStr) {
                receiverId = convUserId;
            }
            // Fallback: just pick the one that ISN'T me
            else {
                receiverId = convUserId !== currentIdStr ? convUserId : convExpertId;
            }
        }
        
        console.log(`Debug Signalling: ME (${currentIdStr}) -> TARGET (${receiverId})`);
        
        if (!receiverId || receiverId === currentIdStr) {
            showToast("Target user not found or invalid for sharing.", "error");
            stopScreenShare(true);
            return;
        }
        
        setSharingWithId(receiverId);
        setScreenShareStatus("starting");
        candidatesQueue.current = []; // Clear queue before starting
        const pc = createPeerConnection(receiverId);

        stream.getTracks().forEach(track => {
            console.log("Adding track to PC:", track.kind);
            track.enabled = true; // Ensure data flows
            pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false
        });
        console.log("[MS-4] PeerConnection offer created with explicit options.");
        await pc.setLocalDescription(offer);
        console.log("[MS-5] Local description set to PC.");

        socket.emit('screenshare_offer', {
            offer: pc.localDescription, // Use localDescription for consistency
            receiverId: String(receiverId),
            senderId: String(currentId)
        });

        stream.getVideoTracks()[0].onended = () => {
            console.log("Screen share stream ended by user");
            stopScreenShare(true);
        };
        
    } catch (err) {
        console.error("Critical Error starting screen share:", err);
        showToast("Screen share failed: " + err.message, "error");
        stopScreenShare(true);
    }
  };

  const handleReceiveOffer = async (offer, senderId) => {
    setPendingOffer({ offer, senderId });
    // Don't open dialog automatically, wait for manual join
    showToast(`${activeConversation?.other_party_name || "Expert"} is sharing their screen`, "info");
  };

  const joinScreenShare = async () => {
    console.log("joinScreenShare called. Current ID:", currentId, "Pending Offer:", !!pendingOffer);
    if (!pendingOffer) {
        showToast(`No active screen share request found for User ID ${currentId}. Please ask the sender to share again.`, "warning");
        return;
    }
    
    try {
        const { offer, senderId } = pendingOffer;
        console.log("Joining screen share from sender:", senderId);
        setIsSharer(false);
        setIsScreenShareDialogOpen(true);
        setSharingWithId(senderId);
        // DO NOT clear candidatesQueue.current here, doing so discards all pre-queued ICE candidates
        
        console.log("[MS-6] Initializing PeerConnection for receiver side...");
        const pc = createPeerConnection(senderId);
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("[MS-7] Remote description set for PeerConnection on receiver side.");
        
        const answer = await pc.createAnswer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: false
        });
        await pc.setLocalDescription(answer);
        
        console.log("[MS-LOCALDESC] Answer created with explicit options and local description set.");
        setScreenShareStatus("connecting");

        // After setting remote description, process queue sequentially
        if (candidatesQueue.current.length > 0) {
            console.log(`[MS-ICE] Processing ${candidatesQueue.current.length} queued candidates on join...`);
            for (const candidate of candidatesQueue.current) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) {
                    console.warn("Adding queued candidate failed during join:", e);
                }
            }
            candidatesQueue.current = [];
        }

        socket.emit('screenshare_answer', {
            answer,
            receiverId: String(senderId),
            senderId: String(currentId)
        });
        
        setPendingOffer(null);
    } catch (err) {
        console.error("Error joining screen share:", err);
        showToast("Failed to join screen share", "error");
    }
  };

  const stopScreenShare = (isInitiator = true) => {
    if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
    }
    
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        setLocalStream(null);
    }
    
    setRemoteStream(null);
    setIsScreenShareDialogOpen(false);
    setIsSharer(false);
    setSharingWithId(null);
    setIceConnectionState("new");

    if (isInitiator && socket && activeConversation) {
        const receiverId = activeConversation.user_id === currentId ? activeConversation.expert_id : activeConversation.user_id;
        socket.emit('screenshare_stop', {
            receiverId: String(receiverId),
            senderId: String(currentId)
        });
    }
  };

  // ─── VIDEO / AUDIO CALLING ─────────────────────────────────────────────
  const getCallReceiverId = () => {
    if (!activeConversation) return null;
    if (activeConversation.type === 'broadcast') return null;
    const uid = String(activeConversation.user_id);
    const eid = String(activeConversation.expert_id);
    const me = String(currentId);
    return uid === me ? eid : uid;
  };

  const createCallPeerConnection = (receiverId, type) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'turn:global.relay.metered.ca:443', username: 'c7a41d90bb86493de1abadff', credential: 'j7fgmXMsNM1sBNcd' },
        { urls: 'turn:global.relay.metered.ca:443?transport=tcp', username: 'c7a41d90bb86493de1abadff', credential: 'j7fgmXMsNM1sBNcd' }
      ],
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      sdpSemantics: 'unified-plan'
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call_candidate', {
          candidate: event.candidate,
          receiverId: receiverId ? String(receiverId) : null,
          senderId: String(currentId),
          isBroadcast: activeConversation?.type === 'broadcast',
          role: currentUser?.role
        });
      }
    };

    pc.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      setRemoteCallStream(stream);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallStatus('connected');
        showToast(`${type === 'video' ? '🎥' : '📞'} Call connected!`, 'success');
      }
      if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        endCall(false);
        showToast('Call connection lost.', 'error');
      }
    };

    callPcRef.current = pc;
    return pc;
  };

  const startVideoCall = async () => {
    if (!activeConversation || !socket) { showToast('Please open a conversation first', 'error'); return; }
    const receiverId = getCallReceiverId();
    const isBroadcast = activeConversation.type === 'broadcast';
    
    if (!receiverId && !isBroadcast) { showToast('Cannot determine call target', 'error'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalCallStream(stream);
      setCallType('video');
      setCallStatus('ringing');
      setIsVideoCallActive(true);
      callCandidatesQueue.current = [];
      const pc = createCallPeerConnection(receiverId, 'video');
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      socket.emit('call_offer', {
        offer: pc.localDescription,
        receiverId: receiverId ? String(receiverId) : null,
        senderId: String(currentId),
        callerName: isBroadcast ? 'Expert' : (currentUser?.name || 'User'),
        callType: 'video',
        isBroadcast: isBroadcast
      });
      sendMessage('📹 Started a video call. Join to connect.');
    } catch(err) {
      showToast('Cannot access camera/microphone: ' + err.message, 'error');
      endCall(true);
    }
  };

  const startAudioCall = async () => {
    if (!activeConversation || !socket) { showToast('Please open a conversation first', 'error'); return; }
    const receiverId = getCallReceiverId();
    const isBroadcast = activeConversation.type === 'broadcast';
    
    if (!receiverId && !isBroadcast) { showToast('Cannot determine call target', 'error'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      setLocalCallStream(stream);
      setCallType('audio');
      setCallStatus('ringing');
      setIsAudioCallActive(true);
      callCandidatesQueue.current = [];
      const pc = createCallPeerConnection(receiverId, 'audio');
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      const offer = await pc.createOffer({ offerToReceiveVideo: false, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      socket.emit('call_offer', {
        offer: pc.localDescription,
        receiverId: receiverId ? String(receiverId) : null,
        senderId: String(currentId),
        callerName: isBroadcast ? 'Expert' : (currentUser?.name || 'User'),
        callType: 'audio',
        isBroadcast: isBroadcast
      });
      sendMessage('📞 Started an audio call. Join to connect.');
    } catch(err) {
      showToast('Cannot access microphone: ' + err.message, 'error');
      endCall(true);
    }
  };

  const stopTitleBlink = () => {
    if (titleBlinkIntervalRef.current) {
      clearInterval(titleBlinkIntervalRef.current);
      titleBlinkIntervalRef.current = null;
    }
  };

  const acceptCall = async () => {
    stopTitleBlink();
    if (!callPendingOffer.current) {
      if (socket && activeConversation) {
        const isBroadcast = activeConversation.type === 'broadcast';
        const receiverId = isBroadcast ? activeConversation.expert_id : (activeConversation.user_id === currentId ? activeConversation.expert_id : activeConversation.user_id);
        socket.emit('request_call_offer', {
          receiverId: String(receiverId),
          senderId: String(currentId),
          isBroadcast: isBroadcast
        });
        showToast("Requesting to join call... please wait.", "info");
      } else {
        showToast("No active call found. It may have already ended.", "warning");
      }
      return;
    }
    const { offer, senderId } = callPendingOffer.current;
    try {
      // Stop ringtone
      if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current = null; }
      const type = callType;
      const constraints = type === 'video' ? { video: true, audio: true } : { video: false, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalCallStream(stream);
      if (type === 'video') setIsVideoCallActive(true);
      else setIsAudioCallActive(true);
      setIsVideoCallIncoming(false);
      setIsAudioCallIncoming(false);
      setCallStatus('connecting');
      // callCandidatesQueue.current = []; // Do NOT clear here, as ICE candidates collected during ringing would be lost
      const pc = createCallPeerConnection(senderId, type);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      if (callCandidatesQueue.current.length > 0) {
        for (const c of callCandidatesQueue.current) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
        }
        callCandidatesQueue.current = [];
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('call_answer', {
        answer,
        receiverId: String(senderId),
        senderId: String(currentId)
      });
      callPendingOffer.current = null;
    } catch(err) {
      showToast('Cannot access media devices: ' + err.message, 'error');
      rejectCall();
    }
  };

  const rejectCall = () => {
    stopTitleBlink();
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current = null; }
    const sid = callerId || callPendingOffer.current?.senderId;
    if (sid && socket) {
      socket.emit('call_rejected', { receiverId: String(sid), senderId: String(currentId) });
    }
    setIsVideoCallIncoming(false);
    setIsAudioCallIncoming(false);
    setCallStatus('idle');
    setCallType(null);
    callPendingOffer.current = null;
  };

  const toggleMute = () => {
    if (localCallStream) {
      localCallStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCallMuted(prev => !prev);
    }
  };

  const toggleVideo = () => {
    if (localCallStream) {
      localCallStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsVideoOff(prev => !prev);
    }
  };

  const endCall = (isInitiator = true) => {
    stopTitleBlink();
    if (ringtoneRef.current) { ringtoneRef.current.pause(); ringtoneRef.current = null; }
    if (callPcRef.current) { callPcRef.current.close(); callPcRef.current = null; }
    if (localCallStream) { localCallStream.getTracks().forEach(t => t.stop()); }
    setLocalCallStream(null);
    setRemoteCallStream(null);
    setIsVideoCallActive(false);
    setIsAudioCallActive(false);
    setIsVideoCallIncoming(false);
    setIsAudioCallIncoming(false);
    setCallStatus('idle');
    setCallType(null);
    setCallerId(null);
    setCallerName(null);
    setIsCallMuted(false);
    setIsVideoOff(false);
    callCandidatesQueue.current = [];
    callPendingOffer.current = null;
    if (isInitiator && socket && activeConversation) {
      const receiverId = getCallReceiverId();
      if (receiverId) socket.emit('call_end', { receiverId: String(receiverId), senderId: String(currentId) });
    }
  };

  const notifyNewProblem = (expertId, userName, problem) => {
    if (socket) {
      socket.emit('new_tracker_entry', { expertId, userName, problem });
    }
  };

  const notifyExpertResponse = (userId, expertName, problem) => {
    if (socket) {
      socket.emit('expert_tracker_response', { userId, expertName, problem });
    }
  };

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversation,
      setActiveConversation,
      messages,
      sendMessage,
      sendFile,
      unreadCount,
      isTyping,
      handleTyping,
      fetchConversations,
      updateConversationTitle,
      onlineUsers,
      socket,
      notifyNewProblem,
      notifyExpertResponse,
      isCreditDialogOpen,
      setIsCreditDialogOpen,
      creditDialogExpertId,
      isChatOpen,
      setIsChatOpen,
      startScreenShare,
      localStream,
      remoteStream,
      isScreenShareDialogOpen,
      setIsScreenShareDialogOpen,
      isSharer,
      stopScreenShare,
      joinScreenShare,
      pendingOffer,
      sharingWithId,
      screenShareStatus,
      iceConnectionState,
      // Video/Audio Call
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
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
