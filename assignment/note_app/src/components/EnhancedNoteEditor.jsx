import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import TextareaAutosize from "react-textarea-autosize";
import UserPresence from "./UserPresence";
import CursorTracker from "./CursorTracker";
import ChatPanel from "./ChatPanel";

const EnhancedNoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  const [note, setNote] = useState({ title: "", content: "", updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [showNameModal, setShowNameModal] = useState(false);

  // Initialize socket connection and fetch note data
  useEffect(() => {
    let loadingTimeout;

    // Check if user has a saved name
    const savedName = localStorage.getItem("collaborative-notes-username");
    if (savedName) {
      setUserName(savedName);
    } else {
      setShowNameModal(true);
    }

    // Fallback: Try to fetch note data directly via REST API
    const fetchNoteData = async () => {
      try {
        console.log("Attempting to fetch note via REST API...");
        const response = await fetch(`http://localhost:5001/notes/${id}`);
        if (response.ok) {
          const noteData = await response.json();
          setNote(noteData);
          setLastSaved(new Date(noteData.updatedAt));
          setLoading(false);
          console.log("Note loaded via REST API fallback");
        } else if (response.status === 404) {
          setError("Note not found");
          setLoading(false);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (err) {
        console.error("Failed to fetch note via REST API:", err);
        setError(
          "Failed to load note. Please check your connection and try again."
        );
        setLoading(false);
      }
    };

    // Set a timeout to fallback to REST API if socket doesn't respond
    loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Socket taking too long, trying REST API fallback...");
        fetchNoteData();
      }
    }, 3000);

    socketRef.current = io("http://localhost:5001", {
      timeout: 5000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);

      // Join note room with current username (delay to ensure userName is set)
      setTimeout(() => {
        const currentUserName =
          localStorage.getItem("collaborative-notes-username") || userName;
        console.log("Joining note room with username:", currentUserName);
        socket.emit("join_note", id, currentUserName || undefined);
      }, 100);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setIsConnected(false);
      // Trigger REST API fallback immediately on connection error
      if (loading) {
        fetchNoteData();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log("Reconnected to server after", attemptNumber, "attempts");
      setIsConnected(true);
      const currentUserName =
        localStorage.getItem("collaborative-notes-username") || userName;
      socket.emit("join_note", id, currentUserName || undefined);
    });

    socket.on("reconnect_error", (error) => {
      console.error("Reconnection failed:", error);
      setIsConnected(false);
    });

    socket.on("note_content", (data) => {
      clearTimeout(loadingTimeout);
      setNote(data);
      setLastSaved(new Date(data.updatedAt));
      setLoading(false);
      setError(""); // Clear any previous errors
      console.log("Note loaded via socket");
    });

    socket.on("note_updated", (data) => {
      // Only update if the change came from another user
      if (data.updatedBy !== socket.id) {
        console.log("Received update from another user:", data.updatedBy);
        setNote((prev) => ({
          ...prev,
          title: data.title,
          content: data.content,
          updatedAt: data.updatedAt,
        }));
        setLastSaved(new Date(data.updatedAt));
        showNotification(`Note updated by ${data.updatedBy}`);
      }
    });

    socket.on("active_users", (users) => {
      console.log("Active users updated:", users);
      setActiveUsers(users);

      const current = users.find((user) => user.id === socket.id);
      if (current) {
        setCurrentUser(current);
        console.log("Current user set:", current);
      }
    });

    socket.on("user_joined", (data) => {
      setActiveUsers(data.activeUsers);

      if (data.user.id !== socket.id) {
        showNotification(`${data.user.name} joined the note`);
      }
    });

    socket.on("user_left", (data) => {
      setActiveUsers(data.activeUsers);

      showNotification(`${data.user.name} left the note`);
    });

    socket.on("user_cursor_move", (data) => {
      setActiveUsers((prev) =>
        prev.map((user) =>
          user.id === data.userId ? { ...user, cursor: data.cursor } : user
        )
      );
    });

    socket.on("user_typing", (data) => {
      setActiveUsers((prev) =>
        prev.map((user) =>
          user.id === data.userId ? { ...user, isTyping: data.isTyping } : user
        )
      );
    });

    socket.on("chat_message", (message) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socket.on("user_name_changed", (data) => {
      setActiveUsers(data.activeUsers);
      if (data.userId === socket.id) {
        setCurrentUser(data.user);
      }
      showNotification(`${data.oldName} changed name to ${data.user.name}`);
    });

    socket.on("error", (error) => {
      clearTimeout(loadingTimeout);
      setError(error.message);
      setLoading(false);
    });

    // Additional timeout to prevent infinite loading
    const maxLoadingTimeout = setTimeout(() => {
      if (loading) {
        setError(
          "Failed to load note. Please check your connection and try again."
        );
        setLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(loadingTimeout);
      clearTimeout(maxLoadingTimeout);
      socket.disconnect();
    };
  }, [id, userName]);

  // Auto-save with debouncing
  useEffect(() => {
    const autoSave = () => {
      if (
        socketRef.current &&
        isConnected &&
        note.title &&
        note.content !== undefined
      ) {
        console.log("Auto-saving note...");
        socketRef.current.emit("note_update", {
          noteId: id,
          title: note.title,
          content: note.content,
        });
      }
    };

    // Clear existing timeout
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    // Only auto-save if we have content and we're not loading
    if (!loading && (note.title || note.content)) {
      autoSaveRef.current = setTimeout(autoSave, 8000); // 8 seconds as per specification (5-10 seconds)
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [note.title, note.content, id, isConnected, loading]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setNote((prev) => ({ ...prev, title: newTitle }));
    handleTyping();
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setNote((prev) => ({ ...prev, content: newContent }));
    handleTyping();
  };

  const handleTyping = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("typing_start", id);
      setIsTyping(true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current.emit("typing_stop", id);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleMouseMove = (e) => {
    if (
      socketRef.current &&
      isConnected &&
      textareaRef.current &&
      currentUser
    ) {
      const rect = textareaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Throttle cursor updates to avoid spam
      if (
        !handleMouseMove.lastUpdate ||
        Date.now() - handleMouseMove.lastUpdate > 100
      ) {
        socketRef.current.emit("cursor_move", {
          noteId: id,
          x,
          y,
        });
        handleMouseMove.lastUpdate = Date.now();
      }
    }
  };

  const handleSave = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("note_update", {
        noteId: id,
        title: note.title,
        content: note.content,
      });
    }
  };

  const handleSendMessage = (message) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("chat_message", {
        noteId: id,
        message,
      });
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (userName.trim()) {
      localStorage.setItem("collaborative-notes-username", userName.trim());
      setShowNameModal(false);

      if (socketRef.current && isConnected) {
        // First change name, then join the room
        socketRef.current.emit("change_name", userName.trim());
        socketRef.current.emit("join_note", id, userName.trim());
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification("Note URL copied to clipboard!");
  };

  const showNotification = (message) => {
    try {
      const notification = document.createElement("div");
      notification.className =
        "fixed top-4 right-4 bg-primary-600 text-white px-4 py-2 rounded-lg shadow-lg z-50";
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        try {
          if (notification.parentNode) {
            document.body.removeChild(notification);
          }
        } catch (err) {
          console.warn("Failed to remove notification:", err);
        }
      }, 3000);
    } catch (err) {
      console.warn("Failed to show notification:", err);
    }
  };

  const formatLastUpdated = (date) => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Loading note...
            </h3>
            <p className="text-gray-600 mb-4">
              Connecting to the collaborative workspace
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? "bg-green-500" : "bg-yellow-500"
                }`}
              ></div>
              <span>
                {isConnected
                  ? "Connected to server"
                  : "Connecting to server..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error loading note</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className="btn btn-primary px-4 py-2"
              onClick={() => window.location.reload()}
            >
              🔄 Retry
            </button>
            <button
              className="btn btn-secondary px-4 py-2"
              onClick={() => navigate("/")}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 fade-in">
      {/* Name Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h3 className="text-xl font-semibold mb-4">
              Welcome! What's your name?
            </h3>
            <form onSubmit={handleNameSubmit}>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="input w-full mb-4"
                autoFocus
                maxLength={50}
              />
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={!userName.trim()}
              >
                Join Note
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              className="btn btn-secondary flex items-center gap-2 px-4 py-2"
              onClick={() => navigate("/")}
            >
              <span>←</span>
              Back
            </button>
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              ></div>
              <span className="text-sm text-gray-600">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>👥</span>
              {activeUsers.length}{" "}
              {activeUsers.length === 1 ? "collaborator" : "collaborators"}
            </div>

            <button
              className="btn btn-secondary flex items-center gap-2 px-4 py-2"
              onClick={copyToClipboard}
            >
              <span>📋</span>
              Copy Link
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-gray-700 mb-3"
            >
              Note Title
            </label>
            <input
              type="text"
              id="title"
              className="input text-2xl font-bold"
              value={note.title}
              onChange={handleTitleChange}
              placeholder="Enter note title..."
              maxLength={200}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100 relative">
            <div className="flex justify-between items-center mb-4">
              <label
                htmlFor="content"
                className="block text-sm font-semibold text-gray-700"
              >
                Content
              </label>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {isTyping && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-pulse">✏️</div>
                    <span>You're typing...</span>
                  </div>
                )}
                <div>Last updated: {formatLastUpdated(lastSaved)}</div>
              </div>
            </div>

            <div className="relative">
              <TextareaAutosize
                ref={textareaRef}
                id="content"
                className="textarea text-lg leading-relaxed resize-none w-full"
                value={note.content}
                onChange={handleContentChange}
                onMouseMove={handleMouseMove}
                placeholder="Start typing your note content... Changes will be saved automatically and synced in real-time with other collaborators."
                minRows={20}
                maxRows={50}
              />

              {/* Cursor Tracker */}
              <CursorTracker
                users={activeUsers}
                currentUserId={currentUser?.id}
              />
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                Auto-save {isConnected ? "enabled" : "disabled"}
              </div>

              <button
                className="btn btn-primary flex items-center gap-2 px-3 py-2"
                onClick={handleSave}
                disabled={!isConnected}
              >
                <span>💾</span>
                Save Now
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <UserPresence users={activeUsers} currentUser={currentUser} />

          {/* Status & Tips */}
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100">
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span>
              Status
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Collaborators:</span>
                <span className="font-medium">{activeUsers.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connection:</span>
                <span
                  className={`font-medium ${
                    isConnected ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Saved:</span>
                <span className="font-medium">
                  {formatLastUpdated(lastSaved)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <ChatPanel
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentUser={currentUser}
        isOpen={isChatOpen}
        onToggle={() => setIsChatOpen(!isChatOpen)}
      />
    </div>
  );
};

export default EnhancedNoteEditor;
