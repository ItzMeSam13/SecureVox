"use client";

import { auth } from "@/Firebase/config";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
// Using inline SVG icons instead of lucide-react
import "../globals.css";

export default function DashboardLayout({ children }) {
	const router = useRouter();
	const pathname = usePathname();
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [activeTab, setActiveTab] = useState("");

	useEffect(() => {
		setActiveTab(pathname);
	}, [pathname]);

	const handleLogout = async () => {
		try {
			setIsLoggingOut(true);
			await signOut(auth);
			router.push("/login");
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	const handleNavigation = (path) => {
		setIsLoading(true);
		setActiveTab(path);
		router.push(path);
		setTimeout(() => setIsLoading(false), 500);
	};

	return (
		<div className='min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'>
			{/* Loading Overlay */}
			{(isLoading || isLoggingOut) && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
					<div className="bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-2xl border border-white/20">
						<div className="flex items-center space-x-3">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
							<span className="text-white font-medium">
								{isLoggingOut ? "Logging out..." : "Loading..."}
							</span>
						</div>
					</div>
				</div>
			)}

			<header className='bg-gradient-to-r from-slate-900/95 via-blue-900/90 to-slate-800/95 backdrop-blur-md text-white shadow-2xl border-b border-white/10'>
				<div className='w-full mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center py-6'>
						{/* Logo Section */}
						<div className="flex items-center space-x-3 group">
							<div className="relative">
								<svg className="w-8 h-8 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
								</svg>
								<div className="absolute inset-0 w-8 h-8 bg-blue-400/20 rounded-full blur-md group-hover:bg-blue-300/30 transition-all duration-300"></div>
							</div>
							<h1 className='text-4xl font-bold text-white'>
								Secure Vox
							</h1>
						</div>

						{/* Logout Button */}
						<button
							onClick={handleLogout}
							disabled={isLoggingOut}
							className='group relative bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-red-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95'>
							<div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-red-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
							<svg className={`w-4 h-4 relative z-10 ${isLoggingOut ? 'animate-spin' : 'group-hover:rotate-12'} transition-transform duration-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
							</svg>
							<span className="relative z-10">
								{isLoggingOut ? "Logging Out..." : "Log Out"}
							</span>
						</button>
					</div>

					{/* Clean Navigation - 3 Separate Buttons */}
					<nav className='pb-8'>
						<div className='flex space-x-8 justify-center'>
							{/* Inmate Profile Button */}
							<button
								onClick={() => handleNavigation('/dashboard/profiles')}
								className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
									activeTab === '/dashboard/inmate-profile' 
										? 'bg-blue-600 text-white shadow-lg' 
										: 'bg-white/10 text-gray-300 hover:bg-blue-500 hover:text-white'
								}`}>
								Inmate Profile
							</button>

							

							{/* Forensic Report Button */}
							<button
								onClick={() => handleNavigation('/dashboard/forensic-report')}
								className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
									activeTab === '/dashboard/forensic-report' 
										? 'bg-emerald-600 text-white shadow-lg' 
										: 'bg-white/10 text-gray-300 hover:bg-emerald-500 hover:text-white'
								}`}>
								Forensic Report
							</button>
						</div>
					</nav>
				</div>
			</header>

			{/* Main Content with enhanced background */}
			<main className='flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 flex relative'>
				{/* Subtle animated background pattern */}
				<div className="absolute inset-0 opacity-5">
					<div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-transparent to-purple-500 animate-pulse"></div>
				</div>
				<div className="relative z-10 w-full">
					{children}
				</div>
			</main>

			{/* Enhanced Footer */}
			<footer className='bg-gradient-to-r from-slate-800/95 via-blue-800/90 to-slate-700/95 backdrop-blur-md text-white mt-auto border-t border-white/10'>
				<div className='w-full mx-auto px-4 sm:px-6 lg:px-8 py-6'>
					<div className='text-center'>
						<div className="flex items-center justify-center space-x-2 mb-2">
							<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
							<h3 className='text-xl font-semibold text-white'>
								Secure Vox
							</h3>
						</div>
						<p className='text-gray-300 text-sm font-medium mb-3'>
							AI-BASED VOICE RECOGNITION & SYNTHETIC VOICE DETECTION
						</p>
						<div className='text-xs text-gray-400 space-y-1'>
							<p className="hover:text-gray-300 transition-colors duration-200">
								Professional Voice Analysis System for Law Enforcement
							</p>
							<p className='hover:text-gray-300 transition-colors duration-200'>
								© 2025 Secure Vox - Police Department Solution
							</p>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}