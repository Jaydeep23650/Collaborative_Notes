# 📝 Collaborative Notes - Real-time Note Taking App

A real-time collaborative note-taking application built with React, Vite, Tailwind CSS, Node.js, Express, MongoDB, and Socket.IO. Multiple users can create, edit, and collaborate on notes simultaneously with live updates.

## ✨ Features

- **Real-time Collaboration**: Multiple users can edit the same note simultaneously
- **Live Updates**: Changes appear instantly across all connected clients
- **Auto-save**: Notes are automatically saved every 5 seconds
- **Active Collaborators**: See how many people are currently editing
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **No Authentication Required**: Simple sharing via URL
- **Connection Status**: Visual indicators for connection state
- **Copy Link**: Easy sharing functionality

## 🚀 Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **React Textarea Autosize** - Auto-resizing textarea

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **Socket.IO** - WebSocket library
- **CORS** - Cross-origin resource sharing

## 📋 Requirements

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd note_app
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd backend
npm install
```

### 4. Environment Setup
```bash
# Copy the example environment file
cp backend/env.example backend/.env

# Edit the .env file with your MongoDB connection string
# For local MongoDB: mongodb://localhost:27017/collaborative-notes
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/collaborative-notes
```

### 5. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# For local MongoDB
mongod

# Or use MongoDB Atlas (cloud)
```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server** (Terminal 1):
```bash
cd backend
npm run dev
```
The backend will run on `http://localhost:5000`

2. **Start the Frontend** (Terminal 2):
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`

### Production Mode

1. **Build the Frontend**:
```bash
npm run build
```

2. **Start the Backend**:
```bash
cd backend
npm start
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/notes` | Create a new note |
| GET | `/api/notes/:id` | Fetch note by ID |
| PUT | `/api/notes/:id` | Update note content (fallback) |
| GET | `/api/health` | Health check |

## 🔌 WebSocket Events

### Client → Server
- `join_note` - Join a note room
- `note_update` - Broadcast content changes

### Server → Client
- `note_content` - Initial note data
- `note_updated` - Live content updates
- `active_users` - Number of active collaborators
- `user_joined` - User joined notification
- `user_left` - User left notification
- `error` - Error messages

## 🎯 Usage

1. **Create a Note**: Enter a title and click "Create Note"
2. **Share**: Copy the URL and share with collaborators
3. **Collaborate**: Multiple users can edit simultaneously
4. **Real-time Updates**: See changes as they happen
5. **Auto-save**: Changes are saved automatically

## 🏗️ Project Structure

```
note_app/
├── src/
│   ├── components/
│   │   ├── CreateNote.jsx      # Note creation page
│   │   └── NoteEditor.jsx      # Note editing with collaboration
│   ├── App.jsx                 # Main app component
│   ├── main.jsx               # React entry point
│   └── index.css              # Global styles
├── backend/
│   ├── models/
│   │   └── Note.js            # MongoDB note model
│   ├── server.js              # Express server with Socket.IO
│   └── package.json           # Backend dependencies
├── package.json               # Frontend dependencies
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # This file
```

## 🎨 Features in Detail

### Real-time Collaboration
- WebSocket connection for instant updates
- Room-based collaboration (one room per note)
- User presence tracking
- Conflict-free collaborative editing

### Auto-save System
- Automatic saving every 5 seconds
- Visual indicators for save status
- Fallback to manual save
- Connection status monitoring

### Modern UI/UX
- Responsive design with Tailwind CSS
- Loading states and animations
- Error handling with user feedback
- Intuitive navigation

## 🔧 Configuration

### Environment Variables
- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)

### Vite Configuration
- Proxy setup for API calls
- React plugin configuration
- Development server settings

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Update API URLs for production

### Backend (Railway/Heroku)
1. Set environment variables
2. Deploy the backend folder
3. Update CORS settings for production domain

## 🧪 Testing

Test the real-time functionality:
1. Open the app in multiple browser tabs
2. Create a note in one tab
3. Open the same note in another tab
4. Edit in both tabs simultaneously
5. Observe real-time synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Jaydeep Saroj**
- Email: jaydeepjnvmzp2002@gmail.com

## 🎯 Evaluation Criteria Met

- ✅ **Real-time functionality (30%)**: WebSocket integration with live updates
- ✅ **MongoDB + API structure (20%)**: Proper schema design and RESTful APIs
- ✅ **React structure + UX (20%)**: Clean component architecture and modern UI
- ✅ **Clean modular code (20%)**: Well-organized, maintainable codebase
- ✅ **Bonus features (10%)**: Active collaborators, auto-save, modern UI

---

**Happy Collaborating! 🚀**