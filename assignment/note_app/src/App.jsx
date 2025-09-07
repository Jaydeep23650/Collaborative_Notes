import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateNote from './components/CreateNote';
import EnhancedNoteEditor from './components/EnhancedNoteEditor';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
              <span className="text-primary-600">📝</span>
              Collaborative Notes
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Real-time collaborative note-taking made simple. Create, share, and collaborate on notes instantly.
            </p>
          </header>
          
          <Routes>
            <Route path="/" element={<CreateNote />} />
            <Route path="/note/:id" element={<EnhancedNoteEditor />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;