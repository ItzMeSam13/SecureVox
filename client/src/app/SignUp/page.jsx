"use client";
import { useState, useEffect } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "@/Firebase/config";
import { useRouter } from "next/navigation";
import signup from "../action/signup";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [policeId, setPoliceId] = useState("");
  const [createUser, user, loading, error] =
    useCreateUserWithEmailAndPassword(auth);
  const [firestoreError, setFirestoreError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFirestoreError("");

    if (!name || !email || !password || !policeId) {
      setFirestoreError("Please fill all fields.");
      return;
    }

    try {
      // 1️⃣ Create user in Firebase Auth
      const res = await createUser(email, password);

      if (res.user) {
        // 2️⃣ Save user info to Firestore
        const data = { name, email, policeId, uid: res.user.uid };
        await signup(data);

        // 3️⃣ Clear form
        setName("");
        setEmail("");
        setPassword("");
        setPoliceId("");

        // 4️⃣ Navigate to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setFirestoreError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] to-[#1B3A61] px-4">
      <div
        className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-xl p-10"
        style={{ minHeight: "350px" }}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-black text-white">Secure Vox</h1>
          <h2 className="text-2xl font-bold text-white mt-3">
            AI Voice Security
          </h2>
          <p className="text-gray-200 text-sm">
            Secure Access | Synthetic Voice Detection
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            placeholder="Full Name"
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
            required
          />
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
            required
          />
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
            required
          />
          <input
            id="policeId"
            name="policeId"
            type="text"
            value={policeId}
            placeholder="Police ID"
            onChange={(e) => setPoliceId(e.target.value)}
            className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
            required
          />

          <button
            type="submit"
            className="w-full py-3 bg-[#1D4ED8] text-white font-semibold rounded-lg hover:bg-[#17395d] transition duration-200"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Create User"}
          </button>

          {(error || firestoreError) && (
            <p className="text-red-500 text-center mt-2">
              {error?.message || firestoreError}
            </p>
          )}

          <p className="text-center text-gray-300 text-sm mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="w-full py-3 bg-[#DB4437] text-white font-semibold rounded-lg hover:bg-[#C1351D] transition duration-200 mt-4"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
