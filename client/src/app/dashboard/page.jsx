"use client";
import { useEffect, useState } from "react";
import { auth } from "@/Firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import ReportList from "@/components/ReportList";
import { GetAllInmates } from "../service/createInmates";
import GenerateReports from "@/app/action/createReports";

// Reusable Loading Component
const LoadingSpinner = () => {
	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'>
			<div className="flex flex-col items-center">
				{/* Main Spinner */}
				<div className="relative">
					<div className="w-16 h-16 border-4 border-slate-700/30 border-t-blue-400 rounded-full animate-spin"></div>
					<div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-black-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
				</div>
			</div>
		</div>
	);
};
export default function Dashboard() {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [selectedAudioFile, setSelectedAudioFile] = useState(null);
	const [showInmateModal, setShowInmateModal] = useState(false);
	const [selectedInmate, setSelectedInmate] = useState(null);
	const [selectedSuspectAudio, setSelectedSuspectAudio] = useState(null);
	const [inmates, setInmates] = useState([]);
	const [loadingInmates, setLoadingInmates] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setLoading(false);
			} else {
				setLoading(false); // Set loading to false before redirect
				router.push("/signup");
			}
		});

		// Add a timeout as fallback in case Firebase doesn't respond
		const timeout = setTimeout(() => {
			setLoading(false);
		}, 5000);

		return () => {
			unsubscribe();
			clearTimeout(timeout);
		};
	}, [router]);

	const handleAudioUpload = (event) => {
		const file = event.target.files[0];
		if (file && file.type.startsWith("audio/")) {
			setSelectedAudioFile(file);
		} else {
			alert("Please select a valid audio file");
		}
	};

	const handleSubmit = () => {
		// TODO: Implement audio analysis submission
		// This function will handle the form data submission
		console.log("Submitting audio for analysis:", selectedAudioFile);
	};

	const handleInmateSelection = (inmate) => {
		setSelectedInmate(inmate);
		// TODO: Load inmate data and set up comparison
		console.log("Selected inmate:", inmate);
	};

	const fetchInmates = async () => {
		setLoadingInmates(true);
		try {
			const data = await GetAllInmates();
			setInmates(data || []);
		} catch (error) {
			console.error("Failed to fetch inmates:", error);
			setInmates([]);
		} finally {
			setLoadingInmates(false);
		}
	};

	const handleOpenInmateModal = () => {
		setShowInmateModal(true);
		fetchInmates(); // Fetch inmates when modal opens
	};

	const handleSuspectAudioUpload = (event) => {
		const file = event.target.files[0];
		if (file && file.type.startsWith("audio/")) {
			setSelectedSuspectAudio(file);
		} else {
			alert("Please select a valid audio file");
		}
	};

	const handleSuspectReportGenerate = async () => {
		if (!selectedInmate || !selectedSuspectAudio) {
			alert("Please select an inmate and an audio file to generate a report.");
			return;
		}

		const formData = new FormData();
		formData.append("inmateId", selectedInmate.id);
		formData.append("audioFile", selectedSuspectAudio);

		const result = await GenerateReports(formData);
		if (!result.success) {
			throw new Error(result.error);
		}
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<>
			<div className='w-full flex flex-col lg:flex-row gap-8'>
				{/* Left Column (Reports) */}
				<div className='lg:w-2/3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white shadow-2xl shadow-black/50'>
					<div className='mb-6'>
						<h2 className='text-3xl font-bold'>Verification Reports</h2>
						<p className='text-gray-300'>
							Review the history of all voice analysis reports.
						</p>
					</div>
					<div className='h-[50vh] overflow-y-auto pr-2'>
						<ReportList />
					</div>
				</div>

				{/* Right Column */}
				<div className='lg:w-1/3 space-y-6'>
					{/* Audio Upload Section */}
					<div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white shadow-2xl shadow-black/50'>
						<div className='mb-6'>
							<h2 className='text-2xl font-bold'>Audio Analysis</h2>
							<p className='text-gray-300'>
								Upload audio file for voice verification
							</p>
						</div>

						<div className='space-y-4'>
							<div>
								<label className='block text-sm font-medium mb-2'>
									Select Audio File
								</label>
								<input
									type='file'
									accept='audio/*'
									onChange={handleAudioUpload}
									className='w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30'
								/>
							</div>

							{selectedAudioFile && (
								<div className='p-3 bg-white/20 rounded-lg'>
									<p className='text-sm'>Selected: {selectedAudioFile.name}</p>
								</div>
							)}

							<button
								onClick={handleSubmit}
								disabled={!selectedAudioFile}
								className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors'>
								Generate Report
							</button>
						</div>
					</div>

					{/* Inmate Selection Section - Made Bigger */}
					<div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-10 text-white shadow-2xl shadow-black/50'>
						<div className='mb-8'>
							<h2 className='text-2xl font-bold mb-3'>Suspect Analysis</h2>
							<p className='text-gray-300 text-lg'>
								Select an inmate for voice comparison and forensic analysis
							</p>
						</div>

						<div className='space-y-6'>
							<div className='bg-white/5 border border-white/10 rounded-xl p-6'>
								<h3 className='text-lg font-semibold mb-2 text-blue-300'>
									Voice Comparison Process
								</h3>
								<p className='text-gray-300 text-sm'>
									Compare suspect voice recordings with known inmate voice samples for identity verification
								</p>
							</div>

							<button
								onClick={handleOpenInmateModal}
								className='w-full py-4 text-lg bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-green-500/25'>
								Select Inmate Suspect
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Inmate Selection Modal */}
			{showInmateModal && (
				<div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
					<div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto'>
						<div className='mb-6 flex justify-between items-center'>
							<h2 className='text-2xl font-bold'>Select Inmate Suspect</h2>
							<button
								onClick={() => setShowInmateModal(false)}
								className='text-gray-400 hover:text-white text-2xl'>
								×
							</button>
						</div>

						{/* Inmate List */}
						<div className='bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-6'>
							{inmates.length > 0 ? (
								<div className='grid grid-cols-1 md:grid-cols-2 gap-4 p-4'>
									{inmates.map((inmate) => (
										<div
											key={inmate.id}
											onClick={() => handleInmateSelection(inmate)}
											className={`p-4 border rounded-lg cursor-pointer transition-all ${
												selectedInmate?.id === inmate.id
													? "border-blue-500 bg-blue-500/20"
													: "border-white/30 bg-white/10 hover:bg-white/20"
											}`}>
											<h3 className='font-semibold'>{inmate.name}</h3>
											<p className='text-sm text-gray-300'>ID: {inmate.id}</p>
										</div>
									))}
								</div>
							) : (
								<div className='p-8 text-center'>
									<p className='text-gray-400 text-lg'>No inmates available</p>
									<p className='text-gray-500 text-sm mt-2'>
										Inmates will appear here when added to the system
									</p>
								</div>
							)}
						</div>

						{/* Audio Upload for Selected Inmate */}
						{selectedInmate && (
							<div className='border-t border-white/20 pt-6'>
								<h3 className='text-xl font-bold mb-4'>
									Voice Analysis for {selectedInmate.name}
								</h3>

								<div className='space-y-4'>
									<div>
										<label className='block text-sm font-medium mb-2'>
											Upload Suspect Audio
										</label>
										<input
											type='file'
											accept='audio/*'
											onChange={handleSuspectAudioUpload}
											className='w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30'
										/>
									</div>

									{selectedSuspectAudio && (
										<div className='p-3 bg-white/20 rounded-lg'>
											<p className='text-sm'>
												Selected: {selectedSuspectAudio.name}
											</p>
										</div>
									)}

									<div className='flex gap-4'>
										<button
											onClick={handleSuspectReportGenerate}
											disabled={!selectedSuspectAudio}
											className='flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors'>
											Generate Comparison Report
										</button>

										<button
											onClick={() => {
												setShowInmateModal(false);
												setSelectedInmate(null);
												setSelectedSuspectAudio(null);
											}}
											className='px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors'>
											Cancel
										</button>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}