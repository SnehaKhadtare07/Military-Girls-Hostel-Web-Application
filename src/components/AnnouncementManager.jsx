import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db } from "../services/firebase";

export default function AnnouncementManager() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = async () => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    setAnnouncements(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return alert("All fields are required!");
    await addDoc(collection(db, "announcements"), {
      title,
      description,
      createdAt: serverTimestamp(),
    });
    setTitle("");
    setDescription("");
    fetchAnnouncements();
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this announcement?")) {
      await deleteDoc(doc(db, "announcements", id));
      fetchAnnouncements();
    }
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Announcement Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Announcement Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-2 rounded h-24"
        />
        <button type="submit" className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
          Add Announcement
        </button>
      </form>

      <div className="max-h-96 overflow-y-auto border-t pt-4">
        {announcements.map((a) => (
          <div key={a.id} className="border-b py-2 flex justify-between items-center">
            <div>
              <h3 className="font-semibold">{a.title}</h3>
              <p className="text-sm text-gray-600">{a.description}</p>
              <p className="text-xs text-gray-400">
                {a.createdAt ? new Date(a.createdAt.toDate()).toLocaleString() : "Just now"}
              </p>
            </div>
            <button
              onClick={() => handleDelete(a.id)}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
