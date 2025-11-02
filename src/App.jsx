import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";   // ✅ import Toaster
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import RuleBook from "./pages/RuleBook";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ResidentDashboard from "./pages/ResidentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicationForm from "./pages/ApplicationForm";
import Gallery from "./pages/Gallery";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />

        {/* Routes */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rulebook" element={<RuleBook />} />
          <Route path="/application" element={<ApplicationForm />} />
          <Route path="/dashboard" element={<ResidentDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>

        {/* ✅ Global Toaster for notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              style: {
                background: "#16a34a", // green-600
                color: "#fff",
              },
            },
            error: {
              style: {
                background: "#dc2626", // red-600
                color: "#fff",
              },
            },
          }}
        />
      </div>
    </Router>
  );
}

export default App;
