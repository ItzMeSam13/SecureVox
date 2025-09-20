"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// simulate small delay if needed
		const timer = setTimeout(() => {
			router.push("/home");
		}, 100); // 100ms delay, just to let loading show
		return () => clearTimeout(timer);
	}, [router]);

	if (loading) {
		return (
			<div className='min-h-screen flex items-center justify-center bg-[#0d1a2f] text-white'>
				<p className='text-lg font-medium'>Loading...</p>
			</div>
		);
	}

	return null; // don't render anything else
}
