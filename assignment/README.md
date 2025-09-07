# Real-time Collaborative Note-Taking App

A real-time collaborative note-taking application where users can create shared note documents, and changes appear live across open clients. Built with Node.js, Express, MongoDB, Socket.IO, and React.

## 📋 Requirements Implementation

This project implements a real-time collaborative note-taking app with the following specifications:

- **Note Model**: `{ title: String, content: String, updatedAt: Date }`
- **API Endpoints**: POST /notes, GET /notes/:id, PUT /notes/:id
- **WebSocket Events**: join_note, note_update, active_users (bonus)
- **Frontend Features**: Note creation page, note editor with large text area, live updates, auto-save every 5-10 seconds
- **Bonus Features**: Last updated time display, active collaborators count

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit the same note simultaneously
- **Live Synchronization**: Changes appear instantly across all connected clients
- **Auto-save**: Notes are automatically saved every 5-10 seconds
- **User Presence**: See who's currently editing the note
- **Persistent Storage**: Notes are stored in MongoDB
- **Responsive Design**: Works on desktop and mobile devices

## 🛠 Tech Stack

### Backend

- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **Socket.IO** - Real-time WebSocket communication
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend

- **React** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Socket.IO Client** - WebSocket client
- **Tailwind CSS** - Styling framework
- **React Textarea Autosize** - Auto-resizing textarea

## 📋 API Endpoints

| Method | Endpoint     | Description                                    |
| ------ | ------------ | ---------------------------------------------- |
| POST   | `/notes`     | Create a new note                              |
| GET    | `/notes/:id` | Fetch note by ID                               |
| PUT    | `/notes/:id` | Update note content (fallback if socket fails) |

## 🔌 WebSocket Events

| Event          | Description                    |
| -------------- | ------------------------------ |
| `join_note`    | Join a note room               |
| `note_update`  | Broadcast live content changes |
| `active_users` | Notify when users join/leave   |

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **MongoDB** (running locally or MongoDB Atlas)
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd collaborative-notes
   ```

2. **Install backend dependencies**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../note_app
   npm install
   ```

4. **Set up environment variables**

   ```bash
   cd ../backend
   cp .env.example .env
   ```

   Edit `.env` file with your MongoDB connection string:

   ```env
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/collaborative-notes
   NODE_ENV=development
   ```

### Running the Application

#### Option 1: Manual Start

1. **Start MongoDB** (if running locally)

   ```bash
   mongod --dbpath "C:\data\db"  # Windows
   # or
   mongod --dbpath /usr/local/var/mongodb  # macOS
   ```

2. **Start the backend server**

   ```bash
   cd backend
   npm run dev
   ```

3. **Start the frontend development server**
   ```bash
   cd note_app
   npm run dev
   ```

#### Option 2: Quick Start (Windows)

Run the provided batch file:

```bash
cd note_app
start-dev.bat
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## 🎯 Usage

1. **Create a Note**: Enter a title on the home page and click "Create Note"
2. **Share the Link**: Copy the note URL and share it with collaborators
3. **Real-time Editing**: Start typing - changes will appear live for all users
4. **See Collaborators**: View active users in the sidebar
5. **Auto-save**: Changes are automatically saved every 8 seconds (within 5-10 second specification)

## 🏗 Project Structure

```
collaborative-notes/
├── backend/                 # Node.js backend
│   ├── models/
│   │   └── Note.js         # MongoDB note schema
│   ├── enhanced-server.js  # Main server file
│   ├── server.js          # Basic server (alternative)
│   ├── package.json
│   └── .env.example
├── note_app/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🎨 Bonus Features Implemented

- ✅ **Active Collaborators**: Real-time user presence indicators
- ✅ **Collaborative Cursors**: See where other users are typing
- ✅ **Chat System**: Built-in chat for collaborators
- ✅ **User Avatars**: Unique avatars for each user
- ✅ **Typing Indicators**: See when others are typing
- ✅ **Connection Status**: Visual connection indicators
- ✅ **Error Handling**: Robust error handling and recovery

## 🧪 Testing Collaboration

1. Open the same note URL in multiple browser tabs/windows
2. Type in one tab and watch changes appear in others
3. Check the active users list updates
4. Test the chat functionality
5. Try disconnecting/reconnecting to test resilience

## 🔧 Development Scripts

### Backend

```bash
npm run dev        # Start with nodemon (auto-restart)
npm start          # Start production server
```

### Frontend

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**

   - Ensure MongoDB is running
   - Check the `MONGODB_URI` in `.env`

2. **Socket Connection Failed**

   - Verify backend is running on port 5001
   - Check firewall settings

3. **Frontend Build Issues**
   - Clear node_modules and reinstall dependencies
   - Check Node.js version compatibility

### Debug Mode

Use the debug startup script for detailed logging:

```bash
debug-startup.bat
```

## 📝 License

MIT License - feel free to use this project for learning and development.

## 👨‍💻 Author

**Jaydeep Saroj**

- Email: jaydeepjnvmzp2002@gmail.com
- GitHub: [Your GitHub Profile]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Note**: This project was built as a demonstration of real-time collaborative features using modern web technologies.
