'use client'
import { useState } from 'react';
import { useCreateUserWithEmailAndPassword} from "react-firebase-hooks/auth";
import { auth } from "@/Firebase/config";

export default function SignupPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [createUser, user, loading, error] = useCreateUserWithEmailAndPassword(auth);

    const handleSubmit = async (e) => {
		e.preventDefault(); // prevent page reload

		try {
			const res = await createUser(email, password);
			console.log("Signup successful:", res);
            setEmail("");
			setPassword("");
		} catch (error) {
			console.error("Signup error:", error);
		}
};
}

export default function SignupPage() {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Function to show a notification message
  const showNotificationMessage = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
    }, 3000); // Hide after 3 seconds
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    showNotificationMessage("Account creation is not implemented yet.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2540] to-[#1B3A61] px-4">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-lg shadow-lg transition-transform duration-300 ease-out z-50">
          {notificationMessage}
        </div>
      )}

      {/* Card */}
          <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-xl p-10" style={{ minHeight: '350px' }}>
        
        {/* Logo / Title */}
        <div className="text-center mb-6">
          <div className="flex justify-center">
            {/* Placeholder for Police/AI Logo */}
            <div className="text-center">
               <h1 style={{ fontSize: "50px", fontWeight: 900, margin: 0, color: "#f6f6f6ff" }}>
                Secure
            </h1>
            <h1 style={{ fontSize: "50px", fontWeight: 900, margin: 0, color: "#f5f5f5ff",padding: "0px 170px" }}>
                 Vox
            </h1>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mt-3">
            AI Voice Security
          </h1>
          <p className="text-gray-200 text-sm">
            Secure Access | Synthetic Voice Detection
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-200">
              Full Name
            </label>
            <input
              id="fullname"
              type="text"
              value={name}
              placeholder="Enter your full name"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFFFFF] focus:outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-200">
              Official Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFFFFF] focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              placeholder="Enter your password"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-[#FFFFFF] focus:outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="policeid" className="block text-sm font-medium text-gray-200">
              Police ID
            </label>
            <input
              id="policeid"
              type="text"
              value={policeId}  
              placeholder="Enter your Police ID"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 mt-1 bg-white/5 text-white placeholder-gray-400 border border-white/20 rounded-lg focus:ring-2 focus:ring-white focus:outline-none"
            />
            </div>
          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#1D4ED8] text-white font-semibold rounded-lg hover:bg-[#17395d] transition duration-200"
          >
             Create Account
          </button>
          <p className="text-center text-gray-300 text-sm mt-0">OR</p>
          <button
            type="button"
            className="w-full py-3 bg-[#DB4437] text-white font-semibold rounded-lg hover:bg-[#C1351D] transition duration-200 mt-4"
          >
            <i className="fab fa-google mr-2"></i> Sign up with Google
          </button>

        {/* Already Registered */}
        <p className="text-center text-gray-300 text-sm mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#FFFFFF] font-semibold hover:underline" onClick={() => showNotificationMessage("Login page is not implemented yet.")}>
            Log in
          </a>
        </p>
      </form>
      </div>
    </div>
  );
}
