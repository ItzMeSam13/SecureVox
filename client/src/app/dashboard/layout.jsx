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

					{/* Enhanced Navigation */}
					<nav className='pb-8'>
						<div className='flex space-x-8 justify-center'>
							<button
								onClick={() => handleNavigation('/dashboard/inmate-profile')}
								className={`group relative flex items-center space-x-4 px-8 py-5 rounded-xl text-base font-medium backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
									activeTab === '/dashboard/inmate-profile' 
										? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-500/20 hover:bg-blue-500/30' 
										: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/10'
								}`}>
								
								{/* Gradient background on hover */}
								<div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:to-cyan-500/10 rounded-xl transition-all duration-300"></div>
								
								{/* Icon with glow effect */}
								<div className="relative">
									<svg className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									<div className="absolute inset-0 w-6 h-6 bg-blue-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</div>
								
								{/* Text with gradient */}
								<span className="relative z-10 bg-gradient-to-r from-white to-gray-200 group-hover:from-blue-200 group-hover:to-cyan-200 bg-clip-text text-transparent font-semibold">
									Inmate Profile
								</span>
								
								{/* Subtle shine effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
							</button>

							<button
								onClick={() => handleNavigation('/dashboard/upload-video')}
								className={`group relative flex items-center space-x-4 px-8 py-5 rounded-xl text-base font-medium backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
									activeTab === '/dashboard/upload-video' 
										? 'bg-purple-500/20 border-purple-400/50 shadow-lg shadow-purple-500/20 hover:bg-purple-500/30' 
										: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-purple-500/10'
								}`}>
								
								{/* Gradient background on hover */}
								<div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 rounded-xl transition-all duration-300"></div>
								
								{/* Icon with glow effect */}
								<div className="relative">
									<div className="flex items-center">
										<svg className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
										</svg>
										<svg className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors duration-300 -ml-1 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
										</svg>
									</div>
									<div className="absolute inset-0 w-6 h-6 bg-purple-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</div>
								
								{/* Text with gradient */}
								<span className="relative z-10 bg-gradient-to-r from-white to-gray-200 group-hover:from-purple-200 group-hover:to-pink-200 bg-clip-text text-transparent font-semibold">
									Analyze Audio
								</span>
								
								{/* Subtle shine effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
							</button>

							<button
								onClick={() => handleNavigation('/dashboard/forensic-report')}
								className={`group relative flex items-center space-x-4 px-8 py-5 rounded-xl text-base font-medium backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
									activeTab === '/dashboard/forensic-report' 
										? 'bg-emerald-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500/30' 
										: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-emerald-500/10'
								}`}>
								
								{/* Gradient background on hover */}
								<div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/10 group-hover:to-teal-500/10 rounded-xl transition-all duration-300"></div>
								
								{/* Icon with glow effect */}
								<div className="relative">
									<svg className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
									</svg>
									<div className="absolute inset-0 w-6 h-6 bg-emerald-400/30 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
								</div>
								
								{/* Text with gradient */}
								<span className="relative z-10 bg-gradient-to-r from-white to-gray-200 group-hover:from-emerald-200 group-hover:to-teal-200 bg-clip-text text-transparent font-semibold">
									Forensic Report
								</span>
								
								{/* Subtle shine effect */}
								<div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
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