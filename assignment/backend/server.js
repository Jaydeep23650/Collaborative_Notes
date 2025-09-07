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
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://jaydeepjnvmzp2002_db_user:<db_password>@cluster0.lymhals.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Store active users for each note room with detailed info
const activeUsers = new Map();
const userSessions = new Map(); // Store user session data
const userColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
let colorIndex = 0;

// API Routes
// Create a new note
app.post('/api/notes', async (req, res) => {
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

// Get note by ID
app.get('/api/notes/:id', async (req, res) => {
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

// Update note content (fallback if socket fails)
app.put('/api/notes/:id', async (req, res) => {
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a note room
  socket.on('join_note', async (noteId) => {
    try {
      // Verify note exists
      const note = await Note.findById(noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      // Leave previous room if any
      if (socket.currentRoom) {
        socket.leave(socket.currentRoom);
        removeUserFromRoom(socket.currentRoom, socket.id);
      }

      // Join new room
      socket.join(noteId);
      socket.currentRoom = noteId;
      
      // Add user to active users
      addUserToRoom(noteId, socket.id);
      
      // Send current note content
      socket.emit('note_content', {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt
      });

      // Notify others about new user
      socket.to(noteId).emit('user_joined', {
        userId: socket.id,
        activeUsers: getActiveUsersForRoom(noteId)
      });

      // Send current active users to the new user
      socket.emit('active_users', getActiveUsersForRoom(noteId));

      console.log(`User ${socket.id} joined note ${noteId}`);
    } catch (error) {
      console.error('Error joining note:', error);
      socket.emit('error', { message: 'Failed to join note' });
    }
  });

  // Handle note updates
  socket.on('note_update', async (data) => {
    try {
      const { noteId, title, content } = data;
      
      if (!socket.currentRoom || socket.currentRoom !== noteId) {
        socket.emit('error', { message: 'Not in this note room' });
        return;
      }

      // Update note in database
      const note = await Note.findById(noteId);
      if (!note) {
        socket.emit('error', { message: 'Note not found' });
        return;
      }

      if (title !== undefined) note.title = title;
      if (content !== undefined) note.content = content;
      
      note.updatedAt = new Date();
      await note.save();

      // Broadcast update to all users in the room (including sender)
      io.to(noteId).emit('note_updated', {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
        updatedBy: socket.id
      });

    } catch (error) {
      console.error('Error updating note:', error);
      socket.emit('error', { message: 'Failed to update note' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.currentRoom) {
      removeUserFromRoom(socket.currentRoom, socket.id);
      
      // Notify others about user leaving
      socket.to(socket.currentRoom).emit('user_left', {
        userId: socket.id,
        activeUsers: getActiveUsersForRoom(socket.currentRoom)
      });
    }
  });
});

// Helper functions for managing active users
function addUserToRoom(noteId, userId) {
  if (!activeUsers.has(noteId)) {
    activeUsers.set(noteId, new Set());
  }
  activeUsers.get(noteId).add(userId);
}

function removeUserFromRoom(noteId, userId) {
  if (activeUsers.has(noteId)) {
    activeUsers.get(noteId).delete(userId);
    if (activeUsers.get(noteId).size === 0) {
      activeUsers.delete(noteId);
    }
  }
}

function getActiveUsersForRoom(noteId) {
  return activeUsers.has(noteId) ? activeUsers.get(noteId).size : 0;
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

