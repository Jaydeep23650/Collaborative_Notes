import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateNote = () => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a note title");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Creating note with title:", title.trim());
      const response = await fetch("http://localhost:5001/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      console.log("Create note response status:", response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Create note error response:", errorData);
        throw new Error(
          `Failed to create note: ${response.status} ${response.statusText}`
        );
      }

      const note = await response.json();
      console.log("Created note:", note);
      console.log("Navigating to:", `/note/${note._id}`);
      // Direct redirect to note editor as per specification
      navigate(`/note/${note._id}`);
    } catch (err) {
      setError(`Failed to create note: ${err.message}`);
      console.error("Error creating note:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto fade-in">
      <div className="bg-white w-full rounded-xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Create a New Note
          </h2>
          <p className="text-gray-600">
            Enter a title for your note and start collaborating in real-time!
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="input text-lg"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your note title..."
              maxLength={200}
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              {title.length}/200 characters
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !title.trim()}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              "Create Note & Start Collaborating"
            )}
          </button>
        </form>

        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🚀</span>
            How it works:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Create & Share</p>
                <p className="text-sm text-gray-600">
                  Create a note and share the URL
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Real-time Sync</p>
                <p className="text-sm text-gray-600">See changes instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Collaborate</p>
                <p className="text-sm text-gray-600">
                  Multiple users can edit together
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">4</span>
              </div>
              <div>
                <p className="font-medium text-gray-800">Auto-save</p>
                <p className="text-sm text-gray-600">
                  Changes saved automatically
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateNote;
