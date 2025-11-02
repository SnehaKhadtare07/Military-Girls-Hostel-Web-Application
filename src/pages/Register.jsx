import React, { useState } from "react";
import { auth, db } from "../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let captcha = "";
  for (let i = 0; i < 6; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
};

export default function Register() {
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [inputCaptcha, setInputCaptcha] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (inputCaptcha !== captcha) {
      toast.error("Invalid CAPTCHA !");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match !");
      return;
    }
    if (form.secretKey !== "MilitaryGIRLShostel@80") {
      toast.error("Invalid secret key !");
      toast.error("You must be a hostel resident candidate to register !");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email: form.email,
        status: "pending",
        createdAt: new Date(),
      });

      toast.success("Registration submitted! Awaiting warden approval.");
      setForm({ email: "", password: "", confirmPassword: "", secretKey: "" });
      setInputCaptcha("");
      setCaptcha(generateCaptcha());
    } catch (error) {
      console.error(error);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side illustration */}
      <div
        className="hidden lg:block lg:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://storyset.com/illustration/secure-login/pana')",
        }}
      >
        <div className="w-full h-full bg-green-900/40"></div>
      </div>

      {/* Right side form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-green-800">
              Military Girls Hostel
            </h1>
            <p className="text-yellow-600">Secure. Supportive. Home.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              placeholder="Email ID"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3"
            />

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3"
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3"
            />

            <input
              type="text"
              name="secretKey"
              placeholder="Enter Secret Key"
              value={form.secretKey}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-3"
            />

            {/* CAPTCHA */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-medium">CAPTCHA</label>
                <button
                  type="button"
                  className="text-blue-600 text-sm hover:underline"
                  onClick={() => setCaptcha(generateCaptcha())}
                >
                  Generate new
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className="captcha-image bg-gray-200 text-gray-800 font-mono text-xl tracking-widest px-4 py-2 rounded-lg select-none line-through">
                  {captcha}
                </div>
                <input
                  type="text"
                  placeholder="Enter CAPTCHA"
                  value={inputCaptcha}
                  onChange={(e) => setInputCaptcha(e.target.value)}
                  className="w-full border rounded-lg px-4 py-3"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700"
            >
              Register
            </button>
          </form>

          <p className="text-center text-sm mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-yellow-600 hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
