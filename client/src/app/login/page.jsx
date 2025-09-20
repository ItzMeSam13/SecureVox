"use client";
import React, { useState } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "@/Firebase/config";
import { useRouter } from "next/navigation";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [customError, setCustomError] = useState(""); // 👈 custom error state
	const router = useRouter();

	const [signInWithEmailAndPassword, user, loading, error] =
		useSignInWithEmailAndPassword(auth);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setCustomError(""); // reset old error
		try {
			const res = await signInWithEmailAndPassword(email, password);
			if (res) {
				setEmail("");
				setPassword("");
				router.push("/dashboard"); // go to dashboard
			}
		} catch (err) {
			setCustomError("Something went wrong. Please try again.");
		}
	};

	// Map Firebase errors into human-friendly messages
	const getErrorMessage = (err) => {
		if (!err) return "";
		if (err.code === "auth/invalid-email") return "Invalid email address.";
		if (err.code === "auth/user-not-found")
			return "No account found with this email.";
		if (err.code === "auth/wrong-password") return "Incorrect password.";
		if (err.code === "auth/invalid-credential")
			return "Invalid email or password.";
		return "Login failed. Please try again.";
	};

	return (
		<div className='bg-[#0d1a2f] flex items-center justify-center min-h-screen p-4'>
			<div className='bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl w-full max-w-xl p-10'>
				<div className='text-center mb-8'>
					<h1 className='text-3xl font-bold mb-1 text-white'>Secure Vox</h1>
					<p className='text-xl font-medium text-gray-300'>AI Voice Security</p>
					<p className='text-xs text-gray-400 mt-1'>
						Secure Access | Synthetic Voice Detection
					</p>
				</div>

				<form id='loginForm' className='space-y-4' onSubmit={handleSubmit}>
					{/* Email Input */}
					<div>
						<label
							htmlFor='officialEmail'
							className='block text-sm font-medium text-gray-300 mb-1'>
							Official Email
						</label>
						<input
							type='email'
							id='officialEmail'
							name='officialEmail'
							placeholder='Enter your email'
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className='w-full px-4 py-2 bg-[#0d1a2f] text-gray-200 border border-gray-600 rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors'
						/>
					</div>

					{/* Password Input */}
					<div>
						<label
							htmlFor='password'
							className='block text-sm font-medium text-gray-300 mb-1'>
							Password
						</label>
						<input
							type='password'
							id='password'
							name='password'
							placeholder='Enter your password'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							className='w-full px-4 py-2 bg-[#0d1a2f] text-gray-200 border border-gray-600 rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors'
						/>
					</div>

					{/* Log In Button */}
					<button
						type='submit'
						className='w-full py-3 mt-6 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors shadow-md'
						disabled={loading}>
						{loading ? "Logging in..." : "Log In"}
					</button>

					{/* Error Message */}
					{(error || customError) && (
						<p className='text-red-500 text-sm mt-2 text-center'>
							{getErrorMessage(error) || customError}
						</p>
					)}
				</form>

				{/* OR Separator */}
				<div className='relative flex items-center my-4'>
					<div className='flex-grow border-t border-gray-600'></div>
					<span className='flex-shrink mx-4 text-gray-500'>OR</span>
					<div className='flex-grow border-t border-gray-600'></div>
				</div>

				{/* Google Button */}
				<button
					type='button'
					className='w-full py-3 rounded-lg font-semibold bg-red-600 hover:bg-red-700 transition-colors shadow-md'>
					Log in with Google
				</button>

				{/* Signup Link */}
				<p className='mt-8 text-center text-gray-400 text-sm'>
					Don't have an account?{" "}
					<a href='/signup' className='text-blue-400 hover:underline'>
						Sign Up
					</a>
				</p>
			</div>
		</div>
	);
}
