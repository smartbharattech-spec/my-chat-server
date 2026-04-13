const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());

app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    db: db ? 'connected' : 'disconnected',
    activeUsers: activeUsers.size,
    timestamp: new Date().toISOString()
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

// Database Connection
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myvastutool',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null
};

console.log('--- Chat Server Startup ---');
console.log('Time:', new Date().toLocaleString());
console.log('Attemping DB connection to:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: !!dbConfig.ssl
});

let db;
async function initDb() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL for real-time tracking');
    
    // STARTUP CLEANUP: Mark everyone as offline
    const [result] = await db.execute('UPDATE marketplace_users SET is_online = 0');
    console.log(`🧹 Startup cleanup: Reset ${result.affectedRows} users to offline`);

    // Handle connection errors
    db.on('error', (err) => {
      console.error('❌ MySQL DB Error:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('Re-initializing DB connection...');
        initDb();
      }
    });

  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.log('⚠️ IMPORTANT: If this is LIVE, check your Render environment variables (DB_HOST, etc.)');
    console.log('Continuing without DB connection...');
  }
}
initDb();

// PERIODIC SYNC: Mark users offline if no activity for 5 minutes (stale connections)
setInterval(async () => {
  if (db) {
    try {
      const [result] = await db.execute(
        'UPDATE marketplace_users SET is_online = 0 WHERE is_online = 1 AND last_seen < (NOW() - INTERVAL 5 MINUTE)'
      );
      if (result.affectedRows > 0) {
        console.log(`🕒 Periodic sync: Marked ${result.affectedRows} stale users as offline`);
      }
    } catch (err) {
      console.error('Periodic offline sync failed:', err);
    }
  }
}, 60000); // Check every minute

const activeUsers = new Map(); // userId -> { socketId, role }

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', async (data) => {
    const userId = String(typeof data === 'object' ? data.userId : data);
    const role = typeof data === 'object' ? data.role : 'user';

    socket.userId = userId;
    socket.join(userId); // JOIN THE USER'S OWN ROOM
    
    activeUsers.set(userId, { socketId: socket.id, role });
    console.log(`User ${userId} (${role}) joined room ${userId} (Socket ID: ${socket.id})`);

    if (db) {
      try {
        await db.execute(
          'UPDATE marketplace_users SET is_online = 1, last_seen = NOW() WHERE id = ?',
          [userId]
        );
      } catch (err) {
        console.error('DB update failed on join:', err);
      }
    }
    
    // Broadcast status to others
    io.emit('status_update', { userId, isOnline: true });

    // NEW: Send current list of online users to the user who just joined
    const onlineList = Array.from(activeUsers.keys());
    socket.emit('initial_online_users', onlineList);
  });

  socket.on('send_message', (data) => {
    const receiverId = String(data.receiverId || data.receiver_id || '');
    const senderId = String(data.senderId || data.sender_id || '');
    const conversationId = data.conversationId || data.conversation_id;
    
    console.log(`Message from ${senderId} to ${receiverId}: ${data.message} (Conv: ${conversationId})`);

    // Emit to the receiver's room
    io.to(receiverId).emit('receive_message', {
      sender_id: senderId,
      receiver_id: receiverId,
      message: data.message,
      conversation_id: conversationId,
      sender_name: data.senderName || data.sender_name,
      created_at: new Date().toISOString()
    });
  });

  socket.on('typing', (data) => {
    const receiverId = String(data.receiverId || data.receiver_id || '');
    const senderId = String(data.senderId || data.sender_id || '');
    const conversationId = data.conversationId || data.conversation_id;

    io.to(receiverId).emit('user_typing', {
      senderId,
      conversationId,
      isTyping: data.isTyping
    });
  });

  socket.on('new_tracker_entry', (data) => {
    const expertId = String(data.expertId || '');
    if (expertId) {
      console.log(`New tracker entry for expert ${expertId} from ${data.userName}`);
      io.to(expertId).emit('notify_new_problem', {
        userName: data.userName,
        problem: data.problem,
        timestamp: new Date().toISOString()
      });
    }
  });

  socket.on('expert_tracker_response', (data) => {
    const userId = String(data.userId || '');
    if (userId) {
      console.log(`Expert guidance for user ${userId} from ${data.expertName}`);
      io.to(userId).emit('notify_expert_guidance', {
        expertName: data.expertName,
        problem: data.problem,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Screen Share Signaling Handlers
  socket.on('screenshare_offer', (data) => {
    const receiverId = String(data.receiverId || '');
    console.log(`Forwarding offer from ${data.senderId} to ${receiverId}`);
    io.to(receiverId).emit('screenshare_offer', data);
  });

  socket.on('screenshare_answer', (data) => {
    const receiverId = String(data.receiverId || '');
    console.log(`Forwarding answer from ${data.senderId} to ${receiverId}`);
    io.to(receiverId).emit('screenshare_answer', data);
  });

  socket.on('screenshare_candidate', (data) => {
    const receiverId = String(data.receiverId || '');
    console.log(`Forwarding candidate from ${data.senderId} to ${receiverId}`);
    io.to(receiverId).emit('screenshare_candidate', data);
  });

  socket.on('screenshare_stop', (data) => {
    const receiverId = String(data.receiverId || '');
    console.log(`Stopping screen share for ${receiverId}`);
    io.to(receiverId).emit('screenshare_stop', data);
  });

  socket.on('disconnect', async () => {
    const userId = socket.userId;
    console.log(`User ${userId} disconnected`);

    if (userId) {
      activeUsers.delete(userId);
      if (db) {
        try {
          await db.execute(
            'UPDATE marketplace_users SET is_online = 0, last_seen = NOW() WHERE id = ?',
            [userId]
          );
        } catch (err) {
          console.error('DB update failed on disconnect:', err);
        }
      }
      // Broadcast offline status even if DB update fails
      io.emit('status_update', { userId, isOnline: false });
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Chat server running on port ${PORT}`);
});
