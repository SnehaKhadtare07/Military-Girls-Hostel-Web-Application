import React, { useState } from "react";
import { Link } from "react-router-dom";
import { db, auth } from "../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const ApplicationForm = () => {
  const [form, setForm] = useState({
    candidateName: "",
    candidateAge: "",
    parentName: "",
    parentServiceId: "",
    phone: "",
    preferredDate: "",
    preferredTime: "",
    roomType: "single",
    additionalNotes: "",
    agreeVisitTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.candidateName.trim()) errs.candidateName = "Candidate name is required";
    if (!form.parentName.trim()) errs.parentName = "Parent's name is required";
    if (!form.parentServiceId.trim()) errs.parentServiceId = "Parent Service ID is required";
    if (!form.phone.trim()) errs.phone = "Phone is required";
    else {
      const phoneRe = /^\+?\d{7,15}$/;
      if (!phoneRe.test(form.phone.trim()))
        errs.phone = "Enter a valid phone number (digits only, optional +)";
    }
    if (!form.preferredDate) errs.preferredDate = "Preferred visiting date is required";
    if (!form.preferredTime) errs.preferredTime = "Preferred time is required";
    if (!form.agreeVisitTerms)
      errs.agreeVisitTerms = "You must agree to the visit terms";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      setLoading(true);
      try {
        await addDoc(collection(db, "applicationForms"), {
          ...form,
          status: "unseen",
          timestamp: serverTimestamp(),
        });
        setSubmitted(true);
      } catch (err) {
        console.error("Error saving application:", err);
        alert("Something went wrong while submitting your application. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-xl w-full bg-white p-8 rounded-lg border shadow">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-900">Application Received</h2>
            <p className="mt-3 text-gray-700">
              Thank you, <span className="font-semibold">{form.candidateName}</span>. Your expression of interest has been recorded.
            </p>
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-gray-700">
              <p>
                <strong>Important:</strong> Our superintendent will contact you within{" "}
                <strong>48 hours</strong> to confirm the booking and finalize a physical visit time.
              </p>
              <p className="mt-2">
                Please keep your phone available and bring original documents during the visit.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/"
                className="px-4 py-2 rounded-md text-sm border hover:bg-gray-50"
              >
                Back to Home
              </Link>
              <Link
                to="/"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 text-sm"
              >
                Done
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 flex items-center justify-center"
      style={{ backgroundColor: "#e6f4ea" }}
    >
      <div className="max-w-3xl w-full bg-white p-8 rounded-lg border shadow">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-green-900">
            Physical Visit - Room Booking Application
          </h1>
          <p className="text-gray-600 mt-2">
            Fill the form below to request a visit. We will contact you to finalize the schedule.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Candidate's Name *
              </label>
              <input
                name="candidateName"
                value={form.candidateName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
              {errors.candidateName && (
                <p className="text-red-600 text-sm mt-1">{errors.candidateName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Candidate Age</label>
              <input
                name="candidateAge"
                value={form.candidateAge}
                onChange={handleChange}
                type="number"
                min="1"
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Military Parent's Name *
              </label>
              <input
                name="parentName"
                value={form.parentName}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
              {errors.parentName && (
                <p className="text-red-600 text-sm mt-1">{errors.parentName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Parent Service ID *
              </label>
              <input
                name="parentServiceId"
                value={form.parentServiceId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
              {errors.parentServiceId && (
                <p className="text-red-600 text-sm mt-1">{errors.parentServiceId}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                type="tel"
                placeholder="+911234567890"
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Visit Date *
              </label>
              <input
                name="preferredDate"
                value={form.preferredDate}
                onChange={handleChange}
                type="date"
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
              {errors.preferredDate && (
                <p className="text-red-600 text-sm mt-1">{errors.preferredDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Time *
              </label>
              <input
                name="preferredTime"
                value={form.preferredTime}
                onChange={handleChange}
                type="time"
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
              {errors.preferredTime && (
                <p className="text-red-600 text-sm mt-1">{errors.preferredTime}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Preferred Room Type
              </label>
              <select
                name="roomType"
                value={form.roomType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              >
                <option value="single">Single</option>
                <option value="shared">Shared (two per room)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <input
                name="additionalNotes"
                value={form.additionalNotes}
                onChange={handleChange}
                placeholder="Any special requests / details"
                className="mt-1 block w-full rounded-md border border-gray-400 p-2"
              />
            </div>
          </div>

          {/* Documents List */}
          <div className="mt-4 bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded">
            <p className="font-semibold text-orange-600 mb-2">
              Bring this Required Documents when you come for physical visit:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-1 text-sm">
              <li>Latest Marksheet</li>
              <li>Bonafide Certificate</li>
              <li>Fee Receipt</li>
              <li>Medical Certificate</li>
              <li>ECHS Card</li>
              <li>ESM-I Card</li>
              <li>ESM Discharge Book</li>
              <li>Commanding Officer Letter (On service/On duty, not retired)</li>
            </ol>
          </div>

          <label className="flex items-start gap-3 mt-2 cursor-pointer">
            <div
              className={`w-4 h-4 border-2 border-gray-400 rounded flex items-center justify-center ${
                form.agreeVisitTerms ? "bg-green-500 border-green-500" : ""
              }`}
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  agreeVisitTerms: !prev.agreeVisitTerms,
                }))
              }
            >
              {form.agreeVisitTerms && <span className="text-white text-xs">✓</span>}
            </div>
            <div className="text-sm text-gray-700">
              I confirm the information provided is accurate and I will bring original
              documents at the time of the visit.
            </div>
          </label>
          {errors.agreeVisitTerms && (
            <p className="text-red-600 text-sm mt-1">{errors.agreeVisitTerms}</p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Link
              to="/rulebook"
              className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
            >
              Back to Rules
            </Link>
            <button
              type="submit"
              disabled={loading}
              className={`px-5 py-2 rounded-md font-semibold text-white ${
                loading ? "bg-gray-400" : "bg-yellow-600 hover:bg-yellow-700"
              }`}
            >
              {loading ? "Submitting..." : "Submit Interest & Request Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplicationForm;
