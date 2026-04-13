// CONFIGURATION
const SERVER_URL = 'https://my-chat-server-bk1j.onrender.com';
const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
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
    ]
};

// DOM ELEMENTS
const connectBtn = document.getElementById('connectBtn');
const startVideoBtn = document.getElementById('startVideoBtn');
const startAudioBtn = document.getElementById('startAudioBtn');
const startShareBtn = document.getElementById('startShareBtn');
const stopAllBtn = document.getElementById('stopAllBtn');
const myIdInput = document.getElementById('myId');
const receiverIdInput = document.getElementById('receiverId');
const statusIndicator = document.getElementById('status');
const callControls = document.getElementById('callControls');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const remoteMsg = document.getElementById('remoteMsg');
const localMicStatus = document.getElementById('localMicStatus');

// STATE variables
let socket;
let peerConnection;
let localStream;
let myUserId;
let receiverUserId;

// 1. CONNECT TO SERVER
connectBtn.onclick = () => {
    myUserId = myIdInput.value.trim();
    if (!myUserId) {
        alert('Please enter your User ID');
        return;
    }

    socket = io(SERVER_URL);

    socket.on('connect', () => {
        statusIndicator.innerText = 'Online - ID: ' + myUserId;
        statusIndicator.classList.add('online');
        socket.emit('join', { userId: myUserId, role: 'user' });
        
        callControls.style.display = 'flex';
        connectBtn.disabled = true;
        myIdInput.disabled = true;
    });

    socket.on('screenshare_offer', async (data) => {
        receiverUserId = data.senderId;
        await initializePeerConnection(false);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit('screenshare_answer', { senderId: myUserId, receiverId: receiverUserId, answer: answer });
        remoteMsg.style.display = 'none';
        console.log('Call Answered');
    });

    socket.on('screenshare_answer', async (data) => {
        if (peerConnection) await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    });

    socket.on('screenshare_candidate', async (data) => {
        if (peerConnection && data.candidate) {
            try { await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch (e) {}
        }
    });

    socket.on('screenshare_stop', () => {
        handleStopAll();
    });
};

// 2. MEDIA ACTIONS
startVideoBtn.onclick = () => startMediaCall({ video: true, audio: true });
startAudioBtn.onclick = () => startMediaCall({ video: false, audio: true });
startShareBtn.onclick = startScreenShare;
stopAllBtn.onclick = handleStopAll;

async function startMediaCall(constraints) {
    receiverUserId = receiverIdInput.value.trim();
    if (!receiverUserId) return alert('Enter Receiver ID');

    try {
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        setupLocalStream();
        await initiateSignaling();
    } catch (err) {
        alert('Media Access Error: ' + err.message);
    }
}

async function startScreenShare() {
    receiverUserId = receiverIdInput.value.trim();
    if (!receiverUserId) return alert('Enter Receiver ID');

    try {
        localStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setupLocalStream();
        await initiateSignaling();
    } catch (err) {
        alert('Screen Share Error: ' + err.message);
    }
}

function setupLocalStream() {
    localVideo.srcObject = localStream;
    localMicStatus.innerText = localStream.getAudioTracks().length > 0 ? "Mic: Active" : "Mic: None";
}

async function initiateSignaling() {
    await initializePeerConnection(true);
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('screenshare_offer', { senderId: myUserId, receiverId: receiverUserId, offer: offer });
}

async function initializePeerConnection(isCaller) {
    if (peerConnection) peerConnection.close();
    peerConnection = new RTCPeerConnection(ICE_SERVERS);

    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('screenshare_candidate', { senderId: myUserId, receiverId: receiverUserId, candidate: event.candidate });
        }
    };

    peerConnection.ontrack = (event) => {
        if (remoteVideo.srcObject !== event.streams[0]) {
            remoteVideo.srcObject = event.streams[0];
            remoteMsg.style.display = 'none';
        }
    };
}

function handleStopAll() {
    if (socket && receiverUserId) {
        socket.emit('screenshare_stop', { senderId: myUserId, receiverId: receiverUserId });
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        localStream = null;
    }
    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
    remoteMsg.style.display = 'block';
}
