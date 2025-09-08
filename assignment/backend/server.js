const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Note = require('./models/Note');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/collaborative_notes')
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Store active users for each note room with detailed info
const activeUsers = new Map(); // noteId -> [user objects]
const userSessions = new Map(); // socketId -> userData
const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
let colorIndex = 0;

// Generate unique user data
function createUserData(socketId, userName = null) {
  return {
    id: socketId,
    name: userName || `User ${Math.floor(Math.random() * 1000)}`,
    color: userColors[colorIndex % userColors.length],
    cursor: { x: 0, y: 0 },
    isTyping: false,
    lastSeen: new Date(),
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${socketId}`,
    currentRoom: null
  };
}

// API Routes
app.post('/notes', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const note = new Note({ title: title.trim() });
    await note.save();
    
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

app.get('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

app.put('/notes/:id', async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    
    note.updatedAt = new Date();
    await note.save();
    
    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    activeConnections: io.engine.clientsCount,
    activeRooms: activeUsers.size,
    totalUsers: userSessions.size,
    mongooseConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 New user connected: ${socket.id}`);

  // Create user data
  const userData = createUserData(socket.id);
  userSessions.set(socket.id, userData);
  colorIndex++;

  // Handle connection errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });

  // Join a note room
  socket.on('join_note', async (noteId, userName) => {
    try {
      console.log(`User ${socket.id} attempting to join note ${noteId}`);
      
      // Update user name if provided
      if (userName && userName.trim()) {
        userData.name = userName.trim();
        userSessions.set(socket.id, userData);
      }
      
      // Verify note exists
      const note = await Note.findById(noteId);
      if (!note) {
        console.error(`Note ${noteId} not found`);
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      // Leave previous room if any
      if (userData.currentRoom) {
        socket.leave(userData.currentRoom);
        removeUserFromRoom(userData.currentRoom, socket.id);
        
        // Notify previous room
        socket.to(userData.currentRoom).emit('user_left', {
          user: userData,
          activeUsers: activeUsers.get(userData.currentRoom) || [],
        });
      }

      // Join new room
      socket.join(noteId);
      userData.currentRoom = noteId;
      userSessions.set(socket.id, userData);
      
      // Add user to room
      addUserToRoom(noteId, userData);
      
      // Send current note content
      socket.emit('note_content', {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt
      });

      // Get current users in room
      const roomUsers = activeUsers.get(noteId) || [];

      // Send to the joining user
      socket.emit('active_users', roomUsers);

      // Notify others in the room
      socket.to(noteId).emit('user_joined', {
        user: userData,
        activeUsers: roomUsers,
      });

      console.log(`✅ User ${userData.name} successfully joined note ${noteId}`);

    } catch (error) {
      console.error('❌ Error joining note:', error);
      socket.emit('error', { message: 'Failed to join note' });
    }
  });

  // Handle note updates
  socket.on('note_update', async (data) => {
    try {
      const { noteId, title, content } = data;
      
      if (!userData.currentRoom || userData.currentRoom !== noteId) {
        console.error(`User ${socket.id} not in room ${noteId}`);
        socket.emit('error', { message: 'Not in this note room' });
        return;
      }

      // Update note in database
      const note = await Note.findById(noteId);
      if (!note) {
        console.error(`Note ${noteId} not found for update`);
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      
      note.updatedAt = new Date();
      await note.save();

      // Broadcast update to all users in the room (excluding sender)
      socket.to(noteId).emit('note_updated', {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
        updatedBy: socket.id,
        updatedByName: userData.name,
      });

      console.log(`📝 Note ${noteId} updated by user ${userData.name}`);

    } catch (error) {
      console.error('❌ Error updating note:', error);
      socket.emit('error', { message: 'Failed to update note' });
    }
  });

  // Handle user name change
  socket.on('change_name', (newName) => {
    try {
      if (newName && newName.trim()) {
        const oldName = userData.name;
        userData.name = newName.trim();
        userSessions.set(socket.id, userData);

        if (userData.currentRoom) {
          const roomUsers = activeUsers.get(userData.currentRoom) || [];
          const updatedUsers = roomUsers.map((user) =>
            user.id === socket.id ? userData : user
          );
          activeUsers.set(userData.currentRoom, updatedUsers);

          // Notify all users in the room including sender
          io.to(userData.currentRoom).emit('user_name_changed', {
            userId: socket.id,
            user: userData,
            oldName,
            activeUsers: updatedUsers,
          });
        }

        console.log(`👤 ${oldName} changed name to ${userData.name}`);
      }
    } catch (error) {
      console.error('Error changing name:', error);
    }
  });

  // Handle typing events
  socket.on('typing_start', () => {
    if (userData.currentRoom) {
      userData.isTyping = true;
      socket.to(userData.currentRoom).emit('user_typing', {
        userId: socket.id,
        isTyping: true,
        user: userData
      });
    }
  });

  socket.on('typing_stop', () => {
    if (userData.currentRoom) {
      userData.isTyping = false;
      socket.to(userData.currentRoom).emit('user_typing', {
        userId: socket.id,
        isTyping: false,
        user: userData
      });
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${userData.name} (${socket.id}), reason: ${reason}`);
    
    if (userData.currentRoom) {
      removeUserFromRoom(userData.currentRoom, socket.id);
      
      // Notify others in the room
      socket.to(userData.currentRoom).emit('user_left', {
        user: userData,
        activeUsers: activeUsers.get(userData.currentRoom) || [],
      });
      
      console.log(`👋 User ${userData.name} left room ${userData.currentRoom}`);
    }

    // Clean up user session
    userSessions.delete(socket.id);
  });

  // Handle manual leave room
  socket.on('leave_note', () => {
    if (userData.currentRoom) {
      const roomId = userData.currentRoom;
      removeUserFromRoom(roomId, socket.id);
      
      socket.leave(roomId);
      userData.currentRoom = null;
      
      // Notify others
      socket.to(roomId).emit('user_left', {
        user: userData,
        activeUsers: activeUsers.get(roomId) || [],
      });
      
      console.log(`🚪 User ${userData.name} manually left room ${roomId}`);
    }
  });
});

// Helper functions for managing active users
function addUserToRoom(noteId, userData) {
  let roomUsers = activeUsers.get(noteId) || [];
  
  // Remove user if already exists (prevent duplicates)
  roomUsers = roomUsers.filter(user => user.id !== userData.id);
  
  // Add user
  roomUsers.push(userData);
  activeUsers.set(noteId, roomUsers);
}

function removeUserFromRoom(noteId, socketId) {
  const roomUsers = activeUsers.get(noteId) || [];
  const updatedUsers = roomUsers.filter((user) => user.id !== socketId);
  
  if (updatedUsers.length === 0) {
    activeUsers.delete(noteId); // Clean up empty rooms
  } else {
    activeUsers.set(noteId, updatedUsers);
  }
}

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 CORS enabled for: localhost:5173, 127.0.0.1:5173, localhost:3000, 127.0.0.1:3000`);
});