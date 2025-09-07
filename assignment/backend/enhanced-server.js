const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const Note = require("./models/Note");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/collaborative-notes"
  )
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Enhanced user management
const activeUsers = new Map(); // noteId -> [users]
const userSessions = new Map(); // socketId -> userData
const userColors = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#FFB347",
  "#87CEEB",
];
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
  };
}

// API Routes - Exact specification implementation
// POST /notes - Create a new note
app.post("/notes", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const note = new Note({
      title: title.trim(),
      content: "",
      updatedAt: new Date(),
    });
    await note.save();

    console.log(`📝 Created new note: ${note._id}`);
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ error: "Failed to create note" });
  }
});

// GET /notes/:id - Fetch note by ID
app.get("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findById(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Error fetching note:", error);
    res.status(500).json({ error: "Failed to fetch note" });
  }
});

// PUT /notes/:id - Update note content (fallback if socket fails)
app.put("/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findByIdAndUpdate(
      id,
      {
        title: title?.trim() || undefined,
        content: content || undefined,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ error: "Failed to update note" });
  }
});

// Keep /api/* endpoints for backward compatibility
app.post("/api/notes", (req, res) =>
  app._router.handle({ ...req, url: "/notes" }, res)
);
app.get("/api/notes/:id", (req, res) =>
  app._router.handle({ ...req, url: `/notes/${req.params.id}` }, res)
);
app.put("/api/notes/:id", (req, res) =>
  app._router.handle({ ...req, url: `/notes/${req.params.id}` }, res)
);

// Enhanced Socket.IO handling
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Create user data
  const userData = createUserData(socket.id);
  userSessions.set(socket.id, userData);
  colorIndex++;

  // WebSocket Events - Exact specification implementation
  // join_note - Join a note room
  socket.on("join_note", async (noteId, userName) => {
    try {
      // Update user name if provided
      if (userName) {
        userData.name = userName;
        userSessions.set(socket.id, userData);
      }

      // Verify note exists
      const note = await Note.findById(noteId);
      if (!note) {
        socket.emit("error", { message: "Note not found" });
        return;
      }

      // Leave previous room
      if (userData.currentRoom) {
        socket.leave(userData.currentRoom);
        removeUserFromRoom(userData.currentRoom, socket.id);
      }

      // Join new room
      socket.join(noteId);
      userData.currentRoom = noteId;
      userSessions.set(socket.id, userData);

      // Add user to room
      addUserToRoom(noteId, userData);

      // Send note content
      socket.emit("note_content", {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
      });

      // Send current users in room
      const roomUsers = activeUsers.get(noteId) || [];

      // Send to the joining user
      socket.emit("active_users", roomUsers);

      // Notify others and send updated user list
      socket.to(noteId).emit("user_joined", {
        user: userData,
        activeUsers: roomUsers,
      });

      // Send updated user list to everyone in the room
      io.to(noteId).emit("active_users", roomUsers);

      console.log(`👤 ${userData.name} joined note ${noteId}`);
    } catch (error) {
      console.error("Error joining note:", error);
      socket.emit("error", { message: "Failed to join note" });
    }
  });

  // note_update - Broadcast live content changes
  socket.on("note_update", async (data) => {
    try {
      const { noteId, title, content } = data;

      // Update note in database
      const note = await Note.findByIdAndUpdate(
        noteId,
        {
          title: title?.trim() || undefined,
          content: content || undefined,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!note) {
        socket.emit("error", { message: "Note not found" });
        return;
      }

      // Broadcast update to all users in room
      io.to(noteId).emit("note_updated", {
        title: note.title,
        content: note.content,
        updatedAt: note.updatedAt,
        updatedBy: socket.id,
        updatedByName: userData.name,
      });

      console.log(`💾 Note ${noteId} updated by ${userData.name}`);
    } catch (error) {
      console.error("Error updating note:", error);
      socket.emit("error", { message: "Failed to update note" });
    }
  });

  // Handle cursor movement
  socket.on("cursor_move", (data) => {
    const { noteId, x, y } = data;
    if (userData.currentRoom === noteId) {
      userData.cursor = { x, y };
      userSessions.set(socket.id, userData);

      // Broadcast cursor position to others in room
      socket.to(noteId).emit("user_cursor_move", {
        userId: socket.id,
        user: userData,
        cursor: { x, y },
      });
    }
  });

  // Handle typing indicators
  socket.on("typing_start", (noteId) => {
    if (userData.currentRoom === noteId) {
      userData.isTyping = true;
      userSessions.set(socket.id, userData);

      socket.to(noteId).emit("user_typing", {
        userId: socket.id,
        user: userData,
        isTyping: true,
      });
    }
  });

  socket.on("typing_stop", (noteId) => {
    if (userData.currentRoom === noteId) {
      userData.isTyping = false;
      userSessions.set(socket.id, userData);

      socket.to(noteId).emit("user_typing", {
        userId: socket.id,
        user: userData,
        isTyping: false,
      });
    }
  });

  // Handle chat messages
  socket.on("chat_message", (data) => {
    const { noteId, message } = data;
    if (userData.currentRoom === noteId && message.trim()) {
      const chatMessage = {
        id: Date.now(),
        user: userData,
        message: message.trim(),
        timestamp: new Date(),
      };

      io.to(noteId).emit("chat_message", chatMessage);
      console.log(`💬 ${userData.name}: ${message}`);
    }
  });

  // Handle user name change
  socket.on("change_name", (newName) => {
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

        socket.to(userData.currentRoom).emit("user_name_changed", {
          userId: socket.id,
          user: userData,
          oldName,
          activeUsers: updatedUsers,
        });
      }

      console.log(`👤 ${oldName} changed name to ${userData.name}`);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`🔌 User disconnected: ${userData.name} (${socket.id})`);

    if (userData.currentRoom) {
      removeUserFromRoom(userData.currentRoom, socket.id);

      // Notify others
      socket.to(userData.currentRoom).emit("user_left", {
        user: userData,
        activeUsers: activeUsers.get(userData.currentRoom) || [],
      });
    }

    userSessions.delete(socket.id);
  });
});

// Helper functions
function addUserToRoom(noteId, userData) {
  const roomUsers = activeUsers.get(noteId) || [];
  const existingUserIndex = roomUsers.findIndex(
    (user) => user.id === userData.id
  );

  if (existingUserIndex >= 0) {
    roomUsers[existingUserIndex] = userData;
  } else {
    roomUsers.push(userData);
  }

  activeUsers.set(noteId, roomUsers);
}

function removeUserFromRoom(noteId, socketId) {
  const roomUsers = activeUsers.get(noteId) || [];
  const updatedUsers = roomUsers.filter((user) => user.id !== socketId);
  activeUsers.set(noteId, updatedUsers);
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    activeConnections: io.engine.clientsCount,
    activeRooms: activeUsers.size,
    totalUsers: userSessions.size,
    mongooseConnection:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    endpoints: {
      "POST /notes": "Create a new note",
      "GET /notes/:id": "Fetch note by ID",
      "PUT /notes/:id": "Update note content (fallback if socket fails)",
    },
    websocketEvents: {
      join_note: "Join a note room",
      note_update: "Broadcast live content changes",
      active_users: "Notify when users join/leave (Bonus)",
    },
  });
});

// Test endpoint to create a sample note
app.get("/api/test-create", async (req, res) => {
  try {
    const testNote = new Note({
      title: "Test Note " + Date.now(),
      content: "This is a test note created at " + new Date().toISOString(),
    });
    await testNote.save();
    res.json({ success: true, note: testNote });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Enhanced server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready with advanced features`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    mongoose.connection.close();
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("✅ Process terminated");
    mongoose.connection.close();
  });
});
