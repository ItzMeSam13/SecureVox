"use client";
import { useEffect, useState } from "react";
import { auth } from "@/Firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Dashboard() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setLoading(false);
			} else {
				router.push("/signup");
			}
		});

		return () => unsubscribe();
	}, [router]);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-gray-900 text-white'>
				<p>Loading...</p>
			</div>
		);
	}

	return (
		<>
			<div className='font-sans bg-[#0A2540] min-h-screen flex flex-col items-center justify-center p-10'>
				{/* Dashboard Box */}
				<div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 w-full max-w-[700px] text-center shadow-2xl shadow-black/50'>
					<h2 className='text-3xl text-white font-bold mb-5'>
						Voice Analysis Dashboard
					</h2>
					<p className='text-base text-gray-300 mb-8'>
						Upload an audio file or record live to begin AI-based verification.
					</p>

					{/* Upload Button */}
					<label className='inline-block bg-[#1D4ED8] text-white py-[14px] px-7 rounded-full cursor-pointer font-semibold transition-all duration-200 ease-in-out hover:bg-blue-800'>
						Upload Voice File
						<input type='file' accept='audio/*' className='hidden' />
					</label>
				</div>
				<button
					onClick={() => signOut(auth)}
					className='mt-8 bg-red-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200'>
					Logout
				</button>
			</div>
		</>
	);
}
