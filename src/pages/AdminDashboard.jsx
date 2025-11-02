// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import {
  FaUsers,
  FaClipboardList,
  FaBullhorn,
  FaNewspaper,
  FaCalendarCheck,
  FaSignOutAlt,
  FaTrashAlt,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../services/firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  addDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AnnouncementManager from "../components/AnnouncementManager";

const ADMIN_EMAIL = "admin@militaryhostel.com";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Registration Management");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);

  // Outpass
  const [outpassRequests, setOutpassRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Complaints
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Notices admin form
  const [noticeForm, setNoticeForm] = useState({ title: "", description: "" });

  // Appointments
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    name: "",
    room: "",
    purpose: "",
    appointmentDate: "",
    notes: "",
  });

  // load user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // auth check
  useEffect(() => {
    const isAdmin = atob(localStorage.getItem("isAdmin") || "") === ADMIN_EMAIL;
    if (!isAdmin && (!user || user.email !== ADMIN_EMAIL)) {
      navigate("/login");
    }
  }, [user, navigate]);

  // fetch registrations with live updates
  useEffect(() => {
    if (active === "Registration Management") {
      const q = query(collection(db, "users"));
      const unsub = onSnapshot(q, (snapshot) => {
        let data = snapshot.docs.map(docu => ({ id: docu.id, ...docu.data() }));

        data.sort((a, b) => {
          if (a.status === "pending" && b.status !== "pending") return -1;
          if (b.status === "pending" && a.status !== "pending") return 1;
          return 0;
        });

        setRegistrations(data);
      }, (error) => {
        console.error("Error fetching registrations:", error);
        toast.error("Error loading registrations");
      });
      return () => unsub();
    }
  }, [active]);

  const handleStatusChange = async (uid, newStatus) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`User ${newStatus} ✅`);
      // Update local state instead of re-fetching
      setRegistrations(prev =>
        prev.map(r => (r.id === uid ? { ...r, status: newStatus } : r))
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status: " + error.message);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm("Are you sure you want to clear all non-pending history?")) {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        snapshot.forEach(async (docu) => {
          const data = docu.data();
          if (data.status !== "pending") {
            await deleteDoc(doc(db, "users", docu.id));
          }
        });
        toast.success("History cleared!");
        fetchRegistrations();
      } catch (error) {
        console.error(error);
        toast.error("Error clearing history");
      }
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("isAdmin");
    await signOut(auth);
    toast("Admin logged out 👋");
    navigate("/");
  };

  // Outpass live subscription
  useEffect(() => {
    if (active === "Outpass Request Management") {
      const q = query(collection(db, "outpassRequests"), orderBy("timestamp", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setOutpassRequests(data);
      });
      return () => unsub();
    }
  }, [active]);

  // Complaints live subscription (for admin to view)
  useEffect(() => {
    if (active === "View Complaints & Notice Board Handler") {
      const q = query(collection(db, "complaints"), orderBy("timestamp", "desc"));
      const unsub = onSnapshot(q, (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setComplaints(arr);
      });
      return () => unsub();
    }
  }, [active]);

  // Appointments live subscription (admin)
  // Application Forms live subscription (admin)
useEffect(() => {
  if (active === "Appointment Management") {
    const q = query(collection(db, "applicationForms"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setAppointments(arr);
      },
      (err) => {
        console.error("Error fetching application forms:", err);
        toast.error("Could not load visitor applications");
      }
    );
    return () => unsub();
  }
}, [active]);


  // Approve / Reject outpass - also update resident's user doc outpass status
  const handleOutpassStatus = async (id, newStatus) => {
    try {
      // 1) update global request doc
      await updateDoc(doc(db, "outpassRequests", id), { status: newStatus });

      // 2) update the corresponding user's document (if userId exists in the request)
      const reqDoc = outpassRequests.find((r) => r.id === id);
      if (reqDoc && reqDoc.userId) {
        const userRef = doc(db, "users", reqDoc.userId);
        // best-effort: update outpass.status in user doc
        try {
          await updateDoc(userRef, { "outpass.status": newStatus });
        } catch (e) {
          // if nested update fails (older SDK) fallback to full replacement
          try {
            const userSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", reqDoc.userId)));
            // fallback not essential; skip silently
          } catch (err) {
            console.warn("Could not update user doc outpass (non-fatal).", err);
          }
        }
      }

      toast.success(`Outpass ${newStatus}`);
      setSelectedRequest(null);
    } catch (error) {
      console.error("Error updating outpass:", error);
      toast.error("Failed to update status");
    }
  };

  // mark complaint read/seen
  const markComplaintStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "complaints", id), { status: newStatus });
      toast.success(`Complaint marked ${newStatus}`);
      setSelectedComplaint(null);
    } catch (error) {
      console.error("Error updating complaint:", error);
      toast.error("Failed to update complaint status");
    }
  };

  // approval handler for applications
  const handleAppointmentStatus = async (id, newStatus) => {
    try {
      const ref = doc(db, "applicationForms", id);
      await updateDoc(ref, { status: newStatus });
      toast.success(`Application ${newStatus}`);
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Error updating application:", error);
      toast.error("Failed to update status");
    }
  };

  // mark application as seen
  const handleMarkAsSeen = async (id) => {
    try {
      await updateDoc(doc(db, "applicationForms", id), {
        status: "Seen",
        seenAt: serverTimestamp(),
      });
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: "Seen" } : a)
      );
      setSelectedAppointment(null);
    } catch (error) {
      console.error("Failed to mark as seen:", error);
    }
  };

  // Admin creates a notice
  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!noticeForm.title.trim() || !noticeForm.description.trim()) {
      toast.error("Please provide title and description");
      return;
    }
    try {
      await addDoc(collection(db, "notices"), {
        title: noticeForm.title.trim(),
        description: noticeForm.description.trim(),
        timestamp: serverTimestamp(),
        createdBy: user?.email || "admin",
      });
      setNoticeForm({ title: "", description: "" });
      toast.success("Notice published");
    } catch (error) {
      console.error("Error creating notice:", error);
      toast.error("Could not publish notice");
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = localStorage.getItem("isAdmin");
  if ((!user || user.email !== ADMIN_EMAIL) && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Only admin can access this page.</p>
          <button onClick={() => navigate("/login")} className="py-2 px-4 bg-green-700 text-white rounded-lg">Go to Login</button>
        </div>
      </div>
    );
  }

  const menuItems = [
    { name: "Registration Management", icon: <FaUsers /> },
    { name: "Outpass Request Management", icon: <FaClipboardList /> },
    { name: "View Complaints & Notice Board Handler", icon: <FaBullhorn /> },
    { name: "Visitor Announcement Board", icon: <FaNewspaper /> },
    { name: "Appointment Management", icon: <FaCalendarCheck /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 bg-green-800 text-white flex flex-col">
        <div className="px-6 py-4 text-2xl font-bold border-b border-green-700">Admin Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <button key={item.name} onClick={() => setActive(item.name)} className={`flex items-center w-full px-3 py-2 rounded-lg hover:bg-green-700 transition ${active === item.name ? "bg-green-700" : ""}`}>
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 text-sm bg-red-600 hover:bg-red-700 transition">
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-bold text-green-900 mb-6">{active}</h1>

        {/* Registration Management */}
        {active === "Registration Management" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-green-800">Registration Requests</h2>
              <button onClick={handleClearHistory} className="flex items-center gap-2 text-red-600 hover:text-red-800 text-sm font-semibold"><FaTrashAlt /> Clear History</button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto border rounded-lg p-4 space-y-4">
              {registrations.length === 0 ? (
                <p className="text-gray-500 text-center">No registration requests yet.</p>
              ) : (
                registrations.map((res) => (
                  <div key={res.id} className="border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{res.email}</p>
                        <p className="text-xs text-gray-500">Status: <span className={`font-medium ${res.status === "approved" ? "text-green-600" : res.status === "rejected" ? "text-red-600" : "text-yellow-600"}`}>{res.status}</span></p>
                        {res.updatedAt && <p className="text-xs text-gray-400 mt-1">Updated on: {new Date(res.updatedAt.seconds * 1000).toLocaleString()}</p>}
                      </div>
                      <div className="flex gap-2">
                        {res.status === "pending" && (
                          <>
                            <button onClick={() => handleStatusChange(res.id, "approved")} className="bg-green-600 text-white px-4 py-1 rounded-lg">Approve</button>
                            <button onClick={() => handleStatusChange(res.id, "rejected")} className="bg-red-600 text-white px-4 py-1 rounded-lg">Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Outpass Request Management */}
        {active === "Outpass Request Management" && (
          <div className="bg-white rounded-lg shadow p-6">
            {outpassRequests.length === 0 ? (
              <p className="text-gray-500 text-center">No outpass requests yet.</p>
            ) : (
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="sticky top-0 bg-green-100 text-green-900 text-left">
                  <tr>
                    <th className="p-3 border">Resident Name</th>
                    <th className="p-3 border">Room No</th>
                    <th className="p-3 border">From</th>
                    <th className="p-3 border">To</th>
                    <th className="p-3 border">Reason</th>
                    <th className="p-3 border">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {outpassRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-green-50 cursor-pointer" onClick={() => setSelectedRequest(req)}>
                      <td className="p-3 border">{req.name}</td>
                      <td className="p-3 border">{req.roomNo}</td>
                      <td className="p-3 border">{req.fromDate}</td>
                      <td className="p-3 border">{req.toDate}</td>
                      <td className="p-3 border">{req.reason}</td>
                      <td className={`p-3 border font-semibold ${req.status === "Approved" ? "text-green-600" : req.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>{req.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Complaints & Notice Board Handler */}
        {active === "View Complaints & Notice Board Handler" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Complaints Container */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-green-800">Resident Complaints</h3>
              </div>

              {complaints.length === 0 ? (
                <p className="text-gray-500">No complaints yet.</p>
              ) : (
                <div className="max-h-[60vh] overflow-y-auto space-y-3">
                  {complaints.map((c) => (
                    <div key={c.id} onClick={() => { setSelectedComplaint(c); if (c.status === "unseen") markComplaintStatus(c.id, "seen"); }} className={`p-3 border rounded-md bg-gray-50 hover:shadow cursor-pointer flex justify-between items-start ${c.status === "unseen" ? "border-green-500" : ""}`}>
                      <div>
                        <p className="font-semibold">{c.subject}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.message}</p>
                        <p className="text-xs text-gray-400 mt-2">{c.name} — {c.room}</p>
                      </div>
                      <div className={`text-sm font-medium ${c.status === "unseen" ? "text-yellow-600" : "text-green-600"}`}>
                        {c.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notice Board Manager */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Update Resident Notice Board</h3>
              <form onSubmit={handleCreateNotice} className="space-y-3">
                <input type="text" placeholder="Title" value={noticeForm.title} onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} className="w-full border border-green-200 rounded-lg p-2" />
                <textarea placeholder="Description" value={noticeForm.description} onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })} rows={4} className="w-full border border-green-200 rounded-lg p-2"></textarea>
                <div className="flex gap-2">
                  <button type="submit" className="bg-green-700 text-white px-4 py-2 rounded-lg">Publish Notice</button>
                  <button type="button" onClick={() => setNoticeForm({ title: "", description: "" })} className="bg-gray-200 px-4 py-2 rounded-lg">Clear</button>
                </div>
              </form>

              <div className="mt-6">
                <h4 className="font-semibold mb-2">Recent Notices (preview)</h4>
                <NoticePreview />
              </div>
            </div>
          </div>
        )}

        {/* Visitor Announcement Board */}
        {active === "Visitor Announcement Board" && (
          <div className="bg-white rounded-lg shadow p-6">
            <AnnouncementManager />
          </div>
        )}

        {/* Application / Admission Management */}
       {active === "Appointment Management" && (
         <div className="bg-white rounded-lg shadow p-6">
           {appointments.length === 0 ? (
             <p className="text-gray-500 text-center">
               No new applications yet.
             </p>
           ) : (
             <table className="w-full border border-gray-200 rounded-lg text-sm">
               <thead>
                 <tr className="bg-green-100 text-green-900 text-left">
                   <th className="p-3 border">Candidate Name</th>
                   <th className="p-3 border">Age</th>
                   <th className="p-3 border">Parent Name</th>
                   <th className="p-3 border">Parent Service ID</th>
                   <th className="p-3 border">Phone</th>
                   <th className="p-3 border">Room Type</th>
                   <th className="p-3 border">Preferred Date</th>
                   <th className="p-3 border">Preferred Time</th>
                   <th className="p-3 border">Additional Notes</th>
                   <th className="p-3 border">Status</th>
                 </tr>
               </thead>
               <tbody>
                 {appointments.map((app) => (
                   <tr
                     key={app.id}
                     className={`cursor-pointer transition ${
                       app.status?.toLowerCase() === "unseen"
                         ? "bg-yellow-50 hover:bg-yellow-100"
                         : "hover:bg-green-50"
                     }`}
                     onClick={async () => {
                       setSelectedAppointment(app);
                       // Mark as seen in Firestore if not already seen
                       if (!app.status || app.status.toLowerCase() === "unseen") {
                         try {
                           await updateDoc(doc(db, "applicationForms", app.id), {
                             status: "Seen",
                             seenAt: serverTimestamp(),
                           });
                           // Update local state immediately for instant UI feedback
                           setAppointments(prev =>
                             prev.map(a => a.id === app.id ? { ...a, status: "Seen" } : a)
                           );
                         } catch (err) {
                           console.error("Failed to mark as seen:", err);
                         }
                       }
                     }}
                   >
                     <td className="p-3 border">{app.candidateName || app.visitorName || app.name}</td>
                     <td className="p-3 border">{app.candidateAge || app.age}</td>
                     <td className="p-3 border">{app.parentName}</td>
                     <td className="p-3 border">{app.parentServiceId || app.serviceId}</td>
                     <td className="p-3 border">{app.phone}</td>
                     <td className="p-3 border">{app.roomType}</td>
                     <td className="p-3 border">{app.preferredDate}</td>
                     <td className="p-3 border">{app.preferredTime}</td>
                     <td className="p-3 border">{app.additionalNotes || app.notes || "-"}</td>
                     <td
                       className={`p-3 border font-semibold ${
                         app.status === "Approved"
                           ? "text-green-600"
                           : app.status === "Rejected"
                           ? "text-red-600"
                           : app.status === "unseen"
                           ? "text-yellow-600"
                           : "text-gray-600"
                       }`}
                     >
                       {app.status || "unseen"}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
       )}
       

        {/* other placeholder */}
        {active !== "Registration Management" && active !== "Outpass Request Management" && active !== "View Complaints & Notice Board Handler" && active !== "Visitor Announcement Board" && active !== "Appointment Management" && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">This section is under construction. Here you will manage <strong>{active}</strong>.</p>
          </div>
        )}
      </main>

      {/* Outpass detail modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6 relative">
            <button onClick={() => setSelectedRequest(null)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl">×</button>
            <h2 className="text-2xl font-bold mb-4 text-green-900 text-center">Outpass Letter</h2>
            <div className="space-y-2 text-gray-800">
              <p><strong>Resident Name:</strong> {selectedRequest.name}</p>
              <p><strong>Room No:</strong> {selectedRequest.roomNo}</p>
              <p><strong>From:</strong> {selectedRequest.fromDate}</p>
              <p><strong>To:</strong> {selectedRequest.toDate}</p>
              <p><strong>Reason:</strong> {selectedRequest.reason}</p>
              <p><strong>Guardian:</strong> {selectedRequest.guardianName}</p>
              <p><strong>Superintendent:</strong> {selectedRequest.superintendentName}</p>
              <p><strong>Status:</strong> <span className={`font-semibold ${selectedRequest.status === "Approved" ? "text-green-600" : selectedRequest.status === "Rejected" ? "text-red-600" : "text-yellow-600"}`}>{selectedRequest.status}</span></p>
            </div>

            {selectedRequest.status === "Pending" && (
              <div className="flex justify-center gap-4 mt-6">
                <button onClick={() => handleOutpassStatus(selectedRequest.id, "Approved")} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"><FaCheck /> Approve</button>
                <button onClick={() => handleOutpassStatus(selectedRequest.id, "Rejected")} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg"><FaTimes /> Reject</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complaint detail modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6 relative">
            <button onClick={() => setSelectedComplaint(null)} className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl">×</button>
            <h2 className="text-2xl font-bold mb-4 text-green-900 text-center">Complaint</h2>
            <div className="space-y-2 text-gray-800">
              <p><strong>Resident Name:</strong> {selectedComplaint.name}</p>
              <p><strong>Room No:</strong> {selectedComplaint.room}</p>
              <p><strong>Subject:</strong> {selectedComplaint.subject}</p>
              <p className="mt-2"><strong>Message:</strong></p>
              <p className="text-gray-700">{selectedComplaint.message}</p>
              <p className="text-xs text-gray-400 mt-2">{selectedComplaint.timestamp && selectedComplaint.timestamp.toDate ? new Date(selectedComplaint.timestamp.toDate()).toLocaleString() : ""}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointment detail modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-lg p-6 relative">
            <button
              onClick={() => setSelectedAppointment(null)}
              className="absolute top-3 right-4 text-gray-500 hover:text-gray-800 text-xl"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold mb-4 text-green-900 text-center">
              Admission Application
            </h2>
            <div className="space-y-2 text-gray-800">
              <p><strong>Candidate Name:</strong> {selectedAppointment.candidateName}</p>
              <p><strong>Candidate Age:</strong> {selectedAppointment.candidateAge || selectedAppointment.age}</p>
              <p><strong>Parent Name:</strong> {selectedAppointment.parentName}</p>
              <p><strong>Parent Service ID:</strong> {selectedAppointment.parentServiceId || selectedAppointment.serviceId}</p>
              <p><strong>Phone:</strong> {selectedAppointment.phone}</p>
              <p><strong>Room Type:</strong> {selectedAppointment.roomType}</p>
              <p><strong>Preferred Date:</strong> {selectedAppointment.preferredDate}</p>
              <p><strong>Preferred Time:</strong> {selectedAppointment.preferredTime}</p>
              <p><strong>Additional Notes:</strong> {selectedAppointment.additionalNotes || selectedAppointment.notes}</p>
              <p><strong>Status:</strong>{" "}
                <span
                  className={`font-semibold ${
                    selectedAppointment.status === "Approved"
                      ? "text-green-600"
                      : selectedAppointment.status === "Rejected"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {selectedAppointment.status || "unseen"}
                </span>
              </p>
            </div>

            {selectedAppointment.status === "Pending" && (
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() =>
                    handleAppointmentStatus(selectedAppointment.id, "Approved")
                  }
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
                >
                  <FaCheck /> Approve
                </button>
                <button
                  onClick={() =>
                    handleAppointmentStatus(selectedAppointment.id, "Rejected")
                  }
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  <FaTimes /> Reject
                </button>
              </div>
            )}

            {((selectedAppointment.status?.toLowerCase() === "unseen") || !selectedAppointment.status) && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => handleMarkAsSeen(selectedAppointment.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                >
                  Mark as Seen
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// small component to preview latest notices inside admin panel
function NoticePreview() {
  const [notices, setNotices] = useState([]);
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ id: d.id, ...d.data(), ts: d.data().timestamp && d.data().timestamp.toDate ? d.data().timestamp.toDate() : d.data().timestamp }));
      setNotices(arr.slice(0, 4));
    });
    return () => unsub();
  }, []);
  return (
    <div className="space-y-2">
      {notices.length === 0 && <p className="text-gray-500">No notices yet.</p>}
      {notices.map((n) => (
        <div key={n.id} className="p-3 border rounded-md bg-gray-50">
          <p className="font-semibold">{n.title}</p>
          <p className="text-sm text-gray-600 mt-1">{n.description}</p>
        </div>
      ))}
    </div>
  );
}
