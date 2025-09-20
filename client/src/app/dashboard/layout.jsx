"use client";
import { auth } from "@/Firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import "../globals.css";

export default function DashboardLayout({ children }) {
	const router = useRouter();
	const handleLogout = async () => {
		await signOut(auth);
		router.push("/login");
	};

	return (
		<div className='min-h-screen flex flex-col bg-gray-50'>
			<header className='bg-slate-900 text-white shadow-lg'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
					<div className='flex justify-between items-center py-4'>
						<h1 className='text-3xl font-bold text-blue-400'>Secure Vox</h1>
						<button
							onClick={handleLogout}
							className='bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2'>
							<svg
								className='w-4 h-4'
								fill='none'
								stroke='currentColor'
								viewBox='0 0 24 24'>
								<path
									strokeLinecap='round'
									strokeLinejoin='round'
									strokeWidth={2}
									d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
								/>
							</svg>
							Log Out
						</button>
					</div>

					{/* Navigation section */}
					<nav className='pb-4'>
						<div className='flex space-x-8'>
							<a
								href='/dashboard/inmate-profile'
								className='flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors duration-200'>
								<svg
									className='w-5 h-5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
									/>
								</svg>
								<span>1) Inmate Profile</span>
							</a>

							<a
								href='/dashboard/upload-video'
								className='flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 transition-colors duration-200'>
								<svg
									className='w-5 h-5'
									fill='none'
									stroke='currentColor'
									viewBox='0 0 24 24'>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z'
									/>
									<path
										strokeLinecap='round'
										strokeLinejoin='round'
										strokeWidth={2}
										d='M9 12v9'
									/>
								</svg>
								<span>2) Upload Video</span>
							</a>
						</div>
					</nav>
				</div>
			</header>

			{/* Main Content */}
			<main className='flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8'>
				{children}
			</main>

			{/* Footer */}
			<footer className='bg-slate-800 text-white mt-auto'>
				<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
					<div className='text-center'>
						<h3 className='text-lg font-semibold text-blue-400 mb-2'>
							Secure Vox
						</h3>
						<p className='text-gray-300 text-sm'>
							AI-BASED VOICE RECOGNITION & SYNTHETIC VOICE DETECTION
						</p>
						<div className='mt-4 text-xs text-gray-400'>
							<p>Professional Voice Analysis System for Law Enforcement</p>
							<p className='mt-1'>
								© 2025 Secure Vox - Police Department Solution
							</p>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}
