import React, { useState } from "react";
import { auth, db } from "../services/firebase";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "admin@militaryhostel.com"; // ✅ Your admin email
const ADMIN_KEY = "MHGS"; // ✅ Admin secret key

// 🔤 Function to generate CAPTCHA
const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let captcha = "";
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

export default function Login() {
  const navigate = useNavigate();
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [inputCaptcha, setInputCaptcha] = useState("");
  const [form, setForm] = useState({ email: "", password: "" });
  const [adminKey, setAdminKey] = useState("");

  // 📩 Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🚪 Handle login submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // CAPTCHA check
    if (inputCaptcha !== captcha) {
      toast.error("Invalid CAPTCHA!");
      return;
    }

    // ✅ ADMIN LOGIN (Skip Firebase)
   if (form.email === ADMIN_EMAIL) {
  if (adminKey === ADMIN_KEY) {
    localStorage.setItem("isAdmin", "true"); // ✅ store admin session
    toast.success("Admin Login Successful ✅");
    navigate("/admin-dashboard");
    return;
  } else {
    toast.error("Invalid Admin Key ❌");
    return;
  }
}

    // ✅ NORMAL USER LOGIN (Firebase Auth)
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

      if (!userDoc.exists()) {
        toast.error("User record not found.");
        await signOut(auth);
        return;
      }

      const userData = userDoc.data();

      // 🕵️ Check user approval status
      if (userData.status === "rejected") {
        toast.error("Your registration was rejected by the department.");
        await signOut(auth);
        return;
      }

      if (userData.status === "pending") {
        toast("Your account is still awaiting approval.", { icon: "⏳" });
        await signOut(auth);
        return;
      }

      if (userData.status === "approved") {
        toast.success("Resident Login Successful ✅");
        navigate("/resident-dashboard");
      }
    } catch (error) {
      console.error(error);
      toast.error("Login error: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* 🌿 Left illustration */}
      <div
        className="hidden lg:block w-1/2 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://storyset.com/illustration/secure-login/rafiki')",
        }}
      >
        <div className="w-full h-full bg-green-900/40"></div>
      </div>

      {/* 🧾 Right login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-green-800">
              Military Girls Hostel
            </h1>
            <p className="text-gray-600">Welcome Back, please login.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email ID"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border rounded-lg"
            />

            {/* Password - hidden for admin */}
            {form.email !== ADMIN_EMAIL && (
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border rounded-lg"
              />
            )}

            {/* Admin Key - shown only when admin email entered */}
            {form.email === ADMIN_EMAIL && (
              <input
                type="password"
                placeholder="Enter Admin Key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                required
                className="w-full px-4 py-3 border rounded-lg"
              />
            )}

            {/* CAPTCHA */}
            <div>
              <div className="flex items-center space-x-4">
                <div className="captcha-image bg-gray-200 text-gray-800 font-mono text-xl tracking-widest px-4 py-2 rounded-lg select-none line-through">
                  {captcha}
                </div>
                <input
                  type="text"
                  placeholder="Enter CAPTCHA"
                  value={inputCaptcha}
                  onChange={(e) => setInputCaptcha(e.target.value)}
                  className="w-full px-4 py-3 border rounded-lg"
                  required
                />
              </div>
              <button
                type="button"
                className="text-blue-600 text-sm mt-2 hover:underline"
                onClick={() => setCaptcha(generateCaptcha())}
              >
                Generate new CAPTCHA
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-green-800 text-white font-bold hover:bg-green-900"
            >
              Login
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Need an account?{" "}
            <a href="/register" className="text-yellow-600 hover:underline">
              Contact Administration
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
