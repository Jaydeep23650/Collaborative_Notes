import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import TextareaAutosize from 'react-textarea-autosize';

const NoteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const autoSaveRef = useRef(null);
  
  const [note, setNote] = useState({ title: '', content: '', updatedAt: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeUsers, setActiveUsers] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    
    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      socket.emit('join_note', id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socket.on('note_content', (data) => {
      setNote(data);
      setLastSaved(new Date(data.updatedAt));
      setLoading(false);
    });

    socket.on('note_updated', (data) => {
      setNote(prev => ({
        ...prev,
        title: data.title,
        content: data.content,
        updatedAt: data.updatedAt
      }));
      setLastSaved(new Date(data.updatedAt));
    });

    socket.on('active_users', (count) => {
      setActiveUsers(count);
    });

    socket.on('user_joined', (data) => {
      setActiveUsers(data.activeUsers);
    });

    socket.on('user_left', (data) => {
      setActiveUsers(data.activeUsers);
    });

    socket.on('error', (error) => {
      setError(error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = () => {
      if (socketRef.current && isConnected && note.title && note.content !== undefined) {
        socketRef.current.emit('note_update', {
          noteId: id,
          title: note.title,
          content: note.content
        });
      }
    };

    // Clear existing auto-save timer
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }

    // Set new auto-save timer (5 seconds after last change)
    autoSaveRef.current = setTimeout(autoSave, 5000);

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [note.title, note.content, id, isConnected]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setNote(prev => ({ ...prev, title: newTitle }));
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setNote(prev => ({ ...prev, content: newContent }));
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1000);
  };

  const handleSave = () => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('note_update', {
        noteId: id,
        title: note.title,
        content: note.content
      });
    }
  };

  const formatLastUpdated = (date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    // You could add a toast notification here
    alert('Note URL copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Loading note...</h3>
            <p className="text-gray-600">Connecting to the collaborative workspace</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error loading note</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4 px-4 py-2">
            <button 
              className="btn btn-secondary flex items-center gap-2 py-4 px-10"
              onClick={() => navigate('/')}
            >
              <span>←</span>
              Back
            </button>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
              isConnected 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span>👥</span>
              {activeUsers} {activeUsers === 1 ? 'collaborator' : 'collaborators'}
            </div>
            
            <button 
              className="btn btn-secondary flex items-center gap-2"
              onClick={copyToClipboard}
            >
              <span>📋</span>
              Copy Link
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-3">
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

      {/* Editor */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <label htmlFor="content" className="block text-sm font-semibold text-gray-700">
            Content
          </label>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {isTyping && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-pulse">✏️</div>
                <span>Typing...</span>
              </div>
            )}
            <div>
              Last updated: {formatLastUpdated(lastSaved)}
            </div>
          </div>
        </div>
        
        <TextareaAutosize
          id="content"
          className="textarea text-lg leading-relaxed resize-none"
          value={note.content}
          onChange={handleContentChange}
          placeholder="Start typing your note content... Changes will be saved automatically and synced in real-time with other collaborators."
          minRows={20}
          maxRows={50}
        />
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Auto-save {isConnected ? 'enabled' : 'disabled'}
          </div>
          
          <button 
            className="btn btn-primary flex items-center gap-2"
            onClick={handleSave}
            disabled={!isConnected}
          >
            <span>💾</span>
            Save Now
          </button>
        </div>
      </div>

      {/* Status & Tips */}
      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span>
              Status
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Active Collaborators:</span>
                <span className="font-medium">{activeUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Connection:</span>
                <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Saved:</span>
                <span className="font-medium">{formatLastUpdated(lastSaved)}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>💡</span>
              Tips
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                Changes auto-save every 5 seconds
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                Share the URL to collaborate
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                See live updates from others
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                Green dot = connected & syncing
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
