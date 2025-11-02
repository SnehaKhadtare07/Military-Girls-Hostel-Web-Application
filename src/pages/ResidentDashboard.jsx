// src/pages/ResidentDashboard.jsx
import React, { useEffect, useState } from "react";
import { auth, db } from "../services/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  const [maintenanceData, setMaintenanceData] = useState({
    name: "",
    roomNo: "",
    roommates: ["", "", ""],
  });

  const [notes, setNotes] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [isDefaultText, setIsDefaultText] = useState(true);

  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaint, setComplaint] = useState({
    subject: "",
    description: "",
  });

  const [showOutpassModal, setShowOutpassModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointment, setAppointment] = useState({
    purpose: "",
    appointmentDate: "",
    notes: "",
  });
  const [outpass, setOutpass] = useState({
    name: "",
    className: "",
    roomNo: "",
    fromDate: "",
    toDate: "",
    reason: "",
    guardianName: "",
    superintendentName: "",
    candidateName: "",
    date: new Date().toLocaleDateString("en-CA"),
    signatureName: "",
    submitted: false,
    status: "Pending",
  });



  // Outpass history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [outpassHistory, setOutpassHistory] = useState([]);

  // Notices
  const [notices, setNotices] = useState([]);
  const [showNoticesPopup, setShowNoticesPopup] = useState(false);

  // helper: format date as YYYY-MM-DD in local timezone (reliable)
  const formatDate = (date) => {
    return date.toLocaleDateString("en-CA");
  };

  // helper: friendly relative time (Today / Yesterday / X days ago / 1 month ago etc.)
  const relativeTime = (dateObj) => {
    if (!dateObj) return "";
    const now = new Date();
    const d = new Date(dateObj);
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 30) return `${diffDays} days ago`;
    const months = Math.floor(diffDays / 30);
    if (months === 1) return "1 month ago";
    return `${months} months ago`;
  };

  // Load user data and user-scoped fields
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);

            // fill maintenance fallback
            if (data.maintenance) {
              const roommates = Array.isArray(data.maintenance.roommates)
                ? [...data.maintenance.roommates]
                : ["", "", ""];

              setMaintenanceData({
                name: data.maintenance.name || data.name || "",
                roomNo: data.maintenance.roomNo || data.room || "",
                roommates: [...roommates]
                  .slice(0, 3)
                  .concat(Array(3 - Math.min(3, roommates.length)).fill("")),
              });
            } else {
              setMaintenanceData((prev) => ({
                ...prev,
                name: data.name || "",
                roomNo: data.room || "",
              }));
            }

            setNotes(data.notes || {});
          } else {
            toast.error("User data not found!");
          }
        } catch (error) {
          console.error("Error loading user data:", error);
          toast.error("Failed to load your data.");
        }
      } else {
        toast.error("You are not authorized!");
        navigate("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // realtime subscribe to notices collection (so residents see new notices immediately)
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      // convert Firestore timestamp to Date for relativeTime
      const formatted = arr.map((n) => {
        return { ...n, ts: n.timestamp && n.timestamp.toDate ? n.timestamp.toDate() : n.timestamp };
      });
      setNotices(formatted);
    });
    return () => unsub();
  }, []);

  // subscribe to user's outpassRequests history (live)
  useEffect(() => {
    let unsub = null;
    const uid = auth.currentUser?.uid;
    if (uid) {
      const q = query(collection(db, "outpassRequests"), where("userId", "==", uid), orderBy("timestamp", "desc"));
      unsub = onSnapshot(q, (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOutpassHistory(arr);
        // if user had an outpass saved in user doc, also keep local outpass in sync if the latest exists
        if (arr.length > 0) {
          const latest = arr[0];
          setOutpass((prev) => ({ ...prev, ...latest }));
        }
      });
    }
    return () => unsub && unsub();
  }, []);



  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );

  if (!userData) return null;

  const roommatesEntered = maintenanceData.roommates.filter((r) => r.trim() !== "");

  const handleSaveMaintenance = async () => {
    if (!maintenanceData.name.trim() || !maintenanceData.roomNo.trim()) {
      toast.error("Please fill out all required fields!");
      return;
    }

    try {
      const uid = auth.currentUser.uid;
      const userRef = doc(db, "users", uid);

      const roommatesTrimmed = maintenanceData.roommates.map((r) => r.trim()).filter(Boolean);

      await updateDoc(userRef, {
        maintenance: {
          name: maintenanceData.name.trim(),
          roomNo: maintenanceData.roomNo.trim(),
          roommates: maintenanceData.roommates,
        },
        name: maintenanceData.name.trim(),
        room: maintenanceData.roomNo.trim(),
        roommates: roommatesTrimmed,
      });

      setUserData((prev) => ({ ...prev, name: maintenanceData.name.trim(), room: maintenanceData.roomNo.trim(), roommates: roommatesTrimmed }));

      toast.success("Maintenance details saved!");
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error("Error saving maintenance:", error);
      toast.error("Failed to save maintenance. Try again.");
    }
  };

  const handleMaintenanceChange = (index, value) => {
    const updated = [...maintenanceData.roommates];
    updated[index] = value;
    setMaintenanceData({ ...maintenanceData, roommates: updated });
  };

  // Date note popup
  const handleDateClick = (date) => {
    const formatted = formatDate(date);
    setSelectedDate(formatted);
    const existingNote = notes[formatted] || "";
    setNoteText(existingNote || "Write your note here !!");
    setIsDefaultText(existingNote === "");
  };

  const handleSaveNote = async () => {
    if (selectedDate) {
      const textToSave = noteText.trim() === "" || noteText === "Write your note here !!" ? "" : noteText.trim();
      const newNotes = { ...notes };
      if (textToSave === "") delete newNotes[selectedDate];
      else newNotes[selectedDate] = textToSave;

      setNotes(newNotes);

      try {
        const uid = auth.currentUser.uid;
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, { notes: newNotes });
        toast.success("Note saved!");
      } catch (error) {
        console.error("Error saving note:", error);
        toast.error("Failed to save note. Try again.");
      }

      setSelectedDate(null);
      setNoteText("");
      setIsDefaultText(true);
    }
  };

  // Outpass submit (stores in outpassRequests collection only)
  const handleOutpassSubmit = async () => {
    if (!outpass.name.trim() || !outpass.roomNo.trim() || !outpass.fromDate || !outpass.toDate || !outpass.reason.trim() || !outpass.guardianName.trim()) {
      toast.error("Please fill all required fields!");
      return;
    }
    try {
      const uid = auth.currentUser.uid;
      const outpassData = {
        ...outpass,
        userId: uid,
        name: outpass.name.trim(),
        roomNo: outpass.roomNo.trim(),
        status: "Pending",
        submitted: true,
        timestamp: serverTimestamp(),
      };

      // Push to global admin collection
      await addDoc(collection(db, "outpassRequests"), outpassData);

      setOutpass({ ...outpass, submitted: true, status: "Pending" });
      toast.success("Outpass request submitted!");
    } catch (error) {
      console.error("Error submitting outpass:", error);
      toast.error("Failed to submit outpass request. Try again.");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isAdmin");
      navigate("/login");
    } catch (err) {
      console.error("Logout error", err);
      toast.error("Could not logout. Try again.");
    }
  };

  // fetch function
  const fetchOutpassHistory = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "outpassRequests"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setOutpassHistory(data);
    } catch (error) {
      console.error("Error fetching outpass history:", error);
      toast.error("Unable to fetch outpass history");
    }
  };

  // Appointment submit
  const handleAppointmentSubmit = async () => {
    if (!appointment.purpose.trim() || !appointment.appointmentDate) {
      toast.error("Please fill all required fields!");
      return;
    }
    try {
      const uid = auth.currentUser.uid;
      const appointmentData = {
        userId: uid,
        name: userData.name || "",
        room: userData.room || "",
        purpose: appointment.purpose.trim(),
        appointmentDate: appointment.appointmentDate,
        notes: appointment.notes.trim(),
        status: "Pending",
        timestamp: serverTimestamp(),
      };

      await addDoc(collection(db, "appointments"), appointmentData);

      setAppointment({ purpose: "", appointmentDate: "", notes: "" });
      toast.success("Appointment request submitted!");
      setShowAppointmentModal(false);
    } catch (error) {
      console.error("Error submitting appointment:", error);
      toast.error("Failed to submit appointment request. Try again.");
    }
  };





  return (
    <div className="p-6 bg-gray-50 min-h-screen relative">
      <style>{`
        .react-calendar__tile.note-day {
          background-color: #dcfce7 !important;
          color: #064e3b !important;
          border-radius: 9999px !important;
        }
        .react-calendar__tile--now.note-day {
          box-shadow: 0 0 0 2px rgba(34,197,94,0.15);
        }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Welcome Back, <span className="text-green-700">{userData.name || "Resident"}</span>
            </h1>
            <p className="text-gray-500 mt-1">Here’s your dashboard for today.</p>
          </div>

          {/* top-right controls: History & Logout */}
          <div className="flex items-center gap-3">
             <button onClick={() => { fetchOutpassHistory(); setShowHistoryModal(true); }} className="py-2 px-3 bg-gray-100 rounded-full hover:bg-green-50 active:scale-95">
              View Outpass History
            </button>
            <button onClick={handleLogout} className="py-2 px-3 bg-red-600 text-white rounded-full hover:bg-red-700 active:scale-95">
              Logout
            </button>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* My Room */}
          <div className="bg-white rounded-xl p-6 shadow-md relative">
            <h3 className="text-lg font-semibold mb-4">
              My Room {maintenanceData.name && <span className="text-green-700">: {maintenanceData.name}</span>}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-2xl font-bold text-green-700">{maintenanceData.roomNo || userData.room || "N/A"}</p>
                <div className="mt-1 text-sm text-gray-500">
                  <p className="font-medium">Roommates:</p>
                  {roommatesEntered.length > 0 ? roommatesEntered.map((r, i) => <p key={i} className="text-gray-600">{r}</p>) : <p className="text-gray-500">None</p>}
                </div>
              </div>
              <img src="./images/dashboard.png" alt="room" className="w-24 h-24 rounded-lg object-cover" />
            </div>
            <div className="mt-4 flex flex-col md:flex-row gap-2 justify-center">
              <button onClick={() => setShowCalendar(true)} className="flex items-center gap-2 text-sm bg-gray-100 py-2 px-3 rounded-full hover:bg-green-100 active:scale-95">
                <span className="material-symbols-outlined text-base">cleaning_services</span>
                Duty Calendar
              </button>
              <button onClick={() => setShowMaintenanceModal(true)} className="flex items-center gap-2 text-sm bg-gray-100 py-2 px-3 rounded-full hover:bg-green-100 active:scale-95">
                <span className="material-symbols-outlined text-base">construction</span>
                Maintenance
              </button>
            </div>
          </div>

          {/* Outpass */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col items-center justify-between">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-green-700 text-3xl">event_available</span>
              <h3 className="text-lg font-semibold">Outpass Request</h3>
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">Apply for leave and track its status.</p>
            <button onClick={() => setShowOutpassModal(true)} className="py-2 px-4 bg-green-700 text-white rounded-full hover:bg-green-800 active:scale-95">
              Request Outpass
            </button>
          </div>

          {/* Complaint */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col items-center justify-between">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-green-700 text-3xl">campaign</span>
              <h3 className="text-lg font-semibold">Complaint Box</h3>
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">Have an issue? File your complaint here.</p>
            <button onClick={() => setShowComplaintModal(true)} className="py-2 px-4 bg-green-700 text-white rounded-full hover:bg-green-800 active:scale-95">File Complaint</button>
          </div>

          {/* Appointment */}
          <div className="bg-white rounded-xl p-6 shadow-md flex flex-col items-center justify-between">
            <div className="flex items-center gap-3 mb-3">
              <span className="material-symbols-outlined text-green-700 text-3xl">event_note</span>
              <h3 className="text-lg font-semibold">Book Appointment</h3>
            </div>
            <p className="text-sm text-gray-500 text-center mb-4">Schedule a meeting with the superintendent.</p>
            <button onClick={() => setShowAppointmentModal(true)} className="py-2 px-4 bg-green-700 text-white rounded-full hover:bg-green-800 active:scale-95">Book Appointment</button>
          </div>

        </div>

        {/* Notice Board (small preview) */}
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Notice Board</h3>
            <button onClick={() => setShowNoticesPopup(true)} className="text-sm text-green-700 hover:underline">View All</button>
          </div>

          {notices.length === 0 ? (
            <p className="text-gray-500">No notices yet.</p>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 3).map((n) => (
                <div key={n.id} className="p-3 border rounded-md bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{n.title}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{n.description}</p>
                    </div>
                    <div className="text-xs text-gray-400 ml-3">{relativeTime(n.ts)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-lg relative">
            <button onClick={() => setShowMaintenanceModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600">✕</button>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Details</h3>

            <input type="text" placeholder="Enter your name" value={maintenanceData.name} onChange={(e) => setMaintenanceData({ ...maintenanceData, name: e.target.value })} className="w-full mb-3 border border-green-200 rounded-lg p-2 focus:border-green-600 outline-none" />
            <input type="text" placeholder="Enter room number" value={maintenanceData.roomNo} onChange={(e) => setMaintenanceData({ ...maintenanceData, roomNo: e.target.value })} className="w-full mb-3 border border-green-200 rounded-lg p-2 focus:border-green-600 outline-none" />

            <p className="text-sm text-gray-600 mb-2">Roommates (max 3)</p>
            {maintenanceData.roommates.map((r, i) => (
              <input key={i} type="text" placeholder={`Roommate ${i + 1}`} value={r} onChange={(e) => handleMaintenanceChange(i, e.target.value)} className="w-full mb-2 border border-green-200 rounded-lg p-2 focus:border-green-600 outline-none" />
            ))}

            <div className="flex gap-2 justify-center mt-3">
              <button onClick={handleSaveMaintenance} className="py-2 px-5 bg-green-700 text-white rounded-lg">Save</button>
              <button onClick={() => setShowMaintenanceModal(false)} className="py-2 px-5 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[380px] shadow-lg relative">
            <button onClick={() => setShowCalendar(false)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600">✕</button>
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Duty Calendar</h3>
            <Calendar onClickDay={handleDateClick} tileClassName={({ date }) => {
              const formatted = formatDate(date);
              if (notes[formatted] && notes[formatted].trim() !== "") { return "note-day"; }
              return "";
            }} className="rounded-lg border-none" />
            <div className="mt-4 text-sm text-gray-500">Click a date to add or edit a note. Dates with saved notes are highlighted.</div>
          </div>
        </div>
      )}

      {/* Note Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-lg relative">
            <button onClick={() => setSelectedDate(null)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600">✕</button>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Note: {selectedDate}</h3>
            <textarea value={noteText} onFocus={() => { if (isDefaultText) { setNoteText(""); setIsDefaultText(false); }}} onBlur={() => { if (noteText.trim() === "") { setNoteText("Write your note here !!"); setIsDefaultText(true); }}} onChange={(e) => setNoteText(e.target.value)} rows={3} className={`w-full border border-green-200 rounded-lg p-2 focus:border-green-600 outline-none ${isDefaultText ? "text-gray-400" : "text-gray-800"}`}></textarea>
            <button onClick={handleSaveNote} className="block mx-auto mt-3 py-2 px-5 bg-green-700 text-white rounded-lg">Save</button>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {showComplaintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 pt-16">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-lg relative">
            <button onClick={() => setShowComplaintModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600">✕</button>
            <h3 className="text-xl font-bold text-green-700 mb-5 text-center">Complaint Box</h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!complaint.subject.trim() || !complaint.description.trim()) {
                toast.error("Please fill all required fields!");
                return;
              }
              try {
                await addDoc(collection(db, "complaints"), {
                  userId: auth.currentUser.uid,
                  name: userData.name || "",
                  room: userData.room || "",
                  subject: complaint.subject.trim(),
                  message: complaint.description.trim(),
                  status: "unseen",
                  timestamp: serverTimestamp(),
                });
                toast.success("✅ Your complaint has been registered successfully.");
                setComplaint({ subject: "", description: "" });
                setShowComplaintModal(false);
              } catch (error) {
                console.error("Error submitting complaint:", error);
                toast.error("Failed to register complaint. Try again.");
              }
            }}>
              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Name</label>
                <input type="text" value={userData.name || ""} readOnly className="w-full border border-green-200 rounded-lg p-2 bg-gray-50 text-gray-700 outline-none" />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Room Number</label>
                <input type="text" value={userData.room || ""} readOnly className="w-full border border-green-200 rounded-lg p-2 bg-gray-50 text-gray-700 outline-none" />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Subject</label>
                <input type="text" placeholder="Enter complaint subject" value={complaint.subject} onChange={(e) => setComplaint({ ...complaint, subject: e.target.value })} className="w-full border border-green-200 rounded-lg p-2 focus:border-green-600 outline-none" />
              </div>

              <div className="mb-3">
                <label className="block text-sm text-gray-600 mb-1">Describe in detail</label>
                <textarea placeholder="Write your complaint in detail..." rows={3} value={complaint.description} onChange={(e) => setComplaint({ ...complaint, description: e.target.value })} className="w-full border border-green-200 rounded-lg p-2 focus:border-green-600 outline-none resize-none"></textarea>
              </div>

              <div className="flex justify-center gap-3 mt-4">
                <button type="submit" className="py-2 px-5 bg-green-700 text-white rounded-lg">Submit</button>
                <button type="button" onClick={() => setShowComplaintModal(false)} className="py-2 px-5 bg-gray-200 text-gray-700 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outpass Modal */}
      {showOutpassModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 pt-16">
          <div className="bg-white rounded-2xl p-4 w-4/5 shadow-lg relative">
            <button onClick={() => setShowOutpassModal(false)} className="absolute top-3 right-3 text-gray-400 hover:text-red-600">✕</button>
            <h3 className="text-xl font-bold text-green-700 mb-4 text-center">Outpass Request Form</h3>

            <p className="text-sm text-gray-700 mb-4">
              To, <br />
              The Superintendent, <input type="text" value={outpass.superintendentName} onChange={(e) => setOutpass({ ...outpass, superintendentName: e.target.value })} className="border-b border-gray-300 inline-block w-36 text-sm" placeholder="Superintendent Name" />
            </p>

            <p className="text-sm mb-4">Subject: Application for permission to stay outside the hostel.</p>

            <p className="text-sm mb-3">Respected Sir/Madam,</p>

            <p className="text-sm mb-3 leading-6">
              I, Mr./Ms. <input type="text" value={outpass.name} onChange={(e) => setOutpass({ ...outpass, name: e.target.value })} className="border-b border-gray-300 inline-block w-36 text-sm" placeholder="Name" />, studying in class <input type="text" value={outpass.className} onChange={(e) => setOutpass({ ...outpass, className: e.target.value })} className="border-b border-gray-300 inline-block w-36 text-sm" placeholder="Class" />, residing in room no. <input type="text" value={outpass.roomNo} onChange={(e) => setOutpass({ ...outpass, roomNo: e.target.value })} className="border-b border-gray-300 inline-block w-24 text-sm" placeholder="Room" />, request permission to stay outside the hostel from date <input type="date" value={outpass.fromDate} onChange={(e) => setOutpass({ ...outpass, fromDate: e.target.value })} className="border-b border-gray-300 inline-block w-24 text-sm" /> to <input type="date" value={outpass.toDate} onChange={(e) => setOutpass({ ...outpass, toDate: e.target.value })} className="border-b border-gray-300 inline-block w-24 text-sm" /> for the reason of <input type="text" value={outpass.reason} onChange={(e) => setOutpass({ ...outpass, reason: e.target.value })} className="border-b border-gray-300 inline-block w-36 text-sm" placeholder="Reason" />.
            </p>

            <p className="text-sm mb-3">During my absence, my parents/guardian will be responsible for me.</p>

            <p className="text-sm mb-3">Parent’s/Guardian’s Name: <input type="text" value={outpass.guardianName} onChange={(e) => setOutpass({ ...outpass, guardianName: e.target.value })} className="border-b border-gray-300 inline-block w-36 text-sm" placeholder="Guardian Name" /></p>

            <p className="text-sm text-gray-800 mb-3">
              Yours sincerely, <br />
              name: <input type="text" value={outpass.signatureName} onChange={(e) => setOutpass({ ...outpass, signatureName: e.target.value })} className="border-b border-gray-300 inline-block w-36 text-sm" placeholder="Your Name" /> <br />
              Date: {new Date().toLocaleDateString("en-CA")}
            </p>

            {!outpass.submitted && (
              <p className="bg-yellow-100 text-yellow-700 text-sm p-2 rounded-md mb-3">
                ⚠️ Once submitted, your request will be reviewed by the Superintendent. The status will be updated as <b>Approved</b> or <b>Rejected</b>. If the status remains <b>Pending</b> and it’s an emergency, please contact the Superintendent directly.
              </p>
            )}

            {!outpass.submitted && (
              <div className="flex justify-center">
                <button onClick={handleOutpassSubmit} className="bg-green-700 text-white px-5 py-2 rounded-lg hover:bg-green-800">Submit</button>
              </div>
            )}

            {outpass.submitted && (
              <div className="text-center mt-3">
                <p className="text-green-700 font-semibold">SUBMITTED ✅</p>
                <p className={`mt-1 font-medium ${outpass.status === "Pending" ? "text-yellow-600" : outpass.status === "Approved" ? "text-green-700" : "text-red-600"}`}>Status of Outpass Request: {outpass.status}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outpass History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative overflow-y-auto max-h-[80vh]">
            <button onClick={() => setShowHistoryModal(false)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl">×</button>
            <h2 className="text-2xl font-bold mb-4 text-green-900 text-center">My Outpass History</h2>

            {outpassHistory.length === 0 ? (
              <p className="text-gray-500 text-center">No outpass history found.</p>
            ) : (
              <div className="space-y-3">
                {outpassHistory.map((op) => (
                  <div key={op.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-semibold">{op.name} — Room {op.roomNo}</p>
                        <p className="text-sm text-gray-600">From: {op.fromDate} • To: {op.toDate}</p>
                        <p className="text-sm text-gray-700 mt-2">{op.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${op.status === "Approved" ? "text-green-600" : op.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>{op.status}</p>
                        <p className="text-xs text-gray-400 mt-2">{op.timestamp && op.timestamp.toDate ? new Date(op.timestamp.toDate()).toLocaleString() : op.timestamp?.toString?.()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notices Popup (View All) */}
      {showNoticesPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 relative overflow-y-auto max-h-[85vh]">
            <button onClick={() => setShowNoticesPopup(false)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl">×</button>
            <h2 className="text-2xl font-bold mb-3">All Notices</h2>
            <div className="space-y-4">
              {notices.length === 0 && <p className="text-gray-500">No notices yet.</p>}
              {notices.map((n) => (
                <div key={n.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-800">{n.title}</h4>
                      <p className="text-sm text-gray-700 mt-1">{n.description}</p>
                    </div>
                    <div className="text-sm text-gray-400">{relativeTime(n.ts)}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 text-right">
              <button onClick={() => setShowNoticesPopup(false)} className="text-red-600 font-medium">View less</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

    