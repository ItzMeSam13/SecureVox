"use client";
import { useEffect, useState, useCallback } from "react";
import { auth } from "@/Firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import ReportList from "@/components/ReportList";
import { GetAllInmates } from "../service/createInmates";
import GenerateReports from "@/app/action/createReports";
import { GetAllReports } from "../service/reports";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import Inmates from "@/app/action/createProfiles";

const LoadingSpinner = () => {
	return (
		<div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800'>
			<div className='flex flex-col items-center'>
				<div className='relative'>
					<div className='w-16 h-16 border-4 border-slate-700/30 border-t-blue-400 rounded-full animate-spin'></div>
					<div
						className='absolute inset-0 w-16 h-16 border-4 border-transparent border-r-black-400 rounded-full animate-spin'
						style={{
							animationDirection: "reverse",
							animationDuration: "1.5s",
						}}></div>
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
	const [reports, setReports] = useState([]);
	const [reportsLoading, setReportsLoading] = useState(true);

	const [isFetchingProfiles, setIsFetchingProfiles] = useState(true);
	const [createInmateFormData, setCreateInmateFormData] = useState({
		name: "",
		audioFile: null,
	});
	const [searchTerm, setSearchTerm] = useState("");
	const [isCreateInmateDialogOpen, setIsCreateInmateDialogOpen] =
		useState(false);
	const [isCreatingInmate, setIsCreatingInmate] = useState(false);
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				fetchReports();
				fetchInmates();
				setLoading(false);
			} else {
				setLoading(false);
				router.push("/signup");
			}
		});

		const timeout = setTimeout(() => {
			setLoading(false);
		}, 5000);

		return () => {
			unsubscribe();
			clearTimeout(timeout);
		};
	}, [router]);

	const fetchReports = async () => {
		setReportsLoading(true);
		try {
			const { success, reports } = await GetAllReports();
			if (success) {
				setReports(reports);
			} else {
				console.error("Failed to fetch reports.");
			}
		} catch (error) {
			console.error("Error in fetchReports:", error);
		} finally {
			setReportsLoading(false);
		}
	};

	const fetchInmates = async () => {
		setIsFetchingProfiles(true);
		try {
			const data = await GetAllInmates();
			setInmates(data || []);
		} catch (error) {
			console.error("Failed to fetch inmates:", error);
			setInmates([]);
		} finally {
			setIsFetchingProfiles(false);
		}
	};

	const handleAudioUpload = (event) => {
		const file = event.target.files[0];
		if (file && file.type.startsWith("audio/")) {
			setSelectedAudioFile(file);
		} else {
			alert("Please select a valid audio file");
		}
	};

	const handleSubmit = () => {
		console.log("Submitting audio for analysis:", selectedAudioFile);
	};

	const handleInmateSelection = (inmate) => {
		setSelectedInmate(inmate);
		console.log("Selected inmate:", inmate);
	};

	const handleOpenInmateModal = () => {
		setShowInmateModal(true);
		fetchInmates();
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

		setIsGeneratingReport(true);
		try {
			const formData = new FormData();
			formData.append("inmateId", selectedInmate.id);
			formData.append("audioFile", selectedSuspectAudio);

			const result = await GenerateReports(formData);
			if (!result.success) {
				throw new Error(result.error);
			}

			// Refresh reports and close modal on success
			await fetchReports();
			setShowInmateModal(false);
			setSelectedInmate(null);
			setSelectedSuspectAudio(null);
		} catch (error) {
			console.error("Error generating report:", error);
			alert(`Failed to generate report: ${error.message}`);
		} finally {
			setIsGeneratingReport(false);
		}
	};

	const handleCreateInmateInputChange = (field) => (e) => {
		if (field === "audioFile") {
			setCreateInmateFormData((prev) => ({
				...prev,
				[field]: e.target.files[0],
			}));
		} else {
			setCreateInmateFormData((prev) => ({ ...prev, [field]: e.target.value }));
		}
	};

	const handleAddInmate = useCallback(async () => {
		if (!createInmateFormData.name || !createInmateFormData.audioFile) {
			alert("Please fill in all required fields");
			return;
		}
		setIsCreatingInmate(true);
		try {
			const dataToSend = new FormData();
			dataToSend.append("name", createInmateFormData.name);
			dataToSend.append("audioFile", createInmateFormData.audioFile);
			const result = await Inmates(dataToSend);
			if (!result.success) {
				throw new Error(result.error);
			}
			fetchInmates();
			setCreateInmateFormData({ name: "", audioFile: null });
			setIsCreateInmateDialogOpen(false);
		} catch (error) {
			console.error("Error creating inmate:", error);
			alert(`An error occurred: ${error.message}`);
		} finally {
			setIsCreatingInmate(false);
		}
	}, [createInmateFormData]);

	const filteredInmates = inmates.filter(
		(inmate) =>
			inmate &&
			inmate.name &&
			inmate.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const cellStyle = {
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		minWidth: 0,
	};

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<>
			<div
				style={{
					fontFamily: "Arial, sans-serif",
					backgroundColor: "#0A2540",
					minHeight: "100vh",
					padding: "40px",
				}}>
				{/* Start of Profiles Section (from the Profiles component) */}
				<div
					style={{
						background: "rgba(255, 255, 255, 0.06)",
						backdropFilter: "blur(12px)",
						border: "1px solid rgba(255,255,255,0.15)",
						borderRadius: "20px",
						padding: "40px",
						marginBottom: "30px",
						boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
					}}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							flexWrap: "wrap",
							gap: "20px",
						}}>
						<div>
							<h1
								style={{
									fontSize: "32px",
									color: "#FFFFFF",
									fontWeight: 700,
									margin: 0,
									marginBottom: "8px",
								}}>
								Inmate Profiles
							</h1>
							<p style={{ fontSize: "16px", color: "#C9D6E2", margin: 0 }}>
								Manage and monitor inmate voice profiles for verification
							</p>
						</div>
						<Dialog
							open={isCreateInmateDialogOpen}
							onOpenChange={setIsCreateInmateDialogOpen}>
							<DialogTrigger asChild>
								<Button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold transition-colors'>
									<Plus size={20} className='mr-2' />
									Create New Inmate
								</Button>
							</DialogTrigger>
							<DialogContent className='bg-slate-900/95 border-slate-700 text-white'>
								<DialogHeader>
									<DialogTitle className='text-xl font-bold text-white'>
										Create New Inmate
									</DialogTitle>
								</DialogHeader>
								<div className='space-y-6'>
									<div>
										<Label
											htmlFor='name'
											className='text-slate-300 text-sm font-medium'>
											Full Name *
										</Label>
										<Input
											id='name'
											name='name'
											placeholder="Enter inmate's full name"
											value={createInmateFormData.name}
											onChange={handleCreateInmateInputChange("name")}
											disabled={isCreatingInmate}
											className='bg-slate-800/50 border-slate-600 text-white mt-2'
										/>
									</div>
									<div>
										<Label
											htmlFor='audioFile'
											className='text-slate-300 text-sm font-medium'>
											Audio File (MP3/MP4) *
										</Label>
										<Input
											id='audioFile'
											type='file'
											name='audiofile'
											accept='.mp3,.mp4,audio/*,video/mp4'
											onChange={handleCreateInmateInputChange("audioFile")}
											disabled={isCreatingInmate}
											className='bg-slate-800/50 border-slate-600 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 mt-2'
										/>
										{createInmateFormData.audioFile && (
											<p className='text-sm text-slate-400 mt-2'>
												Selected: {createInmateFormData.audioFile.name}
											</p>
										)}
									</div>
									<div className='flex gap-3 pt-6'>
										<Button
											variant='secondary'
											onClick={() => setIsCreateInmateDialogOpen(false)}
											disabled={isCreatingInmate}
											className='flex-1 bg-slate-700 text-white hover:bg-slate-600 transition-colors'>
											Cancel
										</Button>
										<Button
											onClick={handleAddInmate}
											disabled={isCreatingInmate}
											className='flex-1 bg-blue-600 hover:bg-blue-700 transition-colors'>
											{isCreatingInmate && (
												<Loader2 className='mr-2 h-4 w-4 animate-spin' />
											)}
											{isCreatingInmate ? "Processing..." : "Create"}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
					<div
						style={{
							marginTop: "30px",
							position: "relative",
							maxWidth: "400px",
						}}>
						<Search
							size={20}
							style={{
								position: "absolute",
								left: "16px",
								top: "50%",
								transform: "translateY(-50%)",
								color: "#C9D6E2",
							}}
						/>
						<Input
							placeholder='Search inmates...'
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className='pl-12 bg-white/5 border-white/15 text-white placeholder:text-slate-400 rounded-full'
						/>
					</div>
				</div>
				<div
					style={{
						background: "rgba(255, 255, 255, 0.06)",
						backdropFilter: "blur(12px)",
						border: "1px solid rgba(255,255,255,0.15)",
						borderRadius: "20px",
						overflow: "hidden",
						boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
					}}>
					<div
						style={{
							background: "rgba(255,255,255,0.08)",
							padding: "20px 30px",
							borderBottom: "1px solid rgba(255,255,255,0.1)",
							display: "grid",
							gridTemplateColumns: "0.5fr 1.5fr 2fr 1.5fr",
							gap: "24px",
							alignItems: "center",
							fontSize: "14px",
							fontWeight: "600",
							color: "#C9D6E2",
							textTransform: "uppercase",
							letterSpacing: "0.5px",
						}}>
						<div style={cellStyle}>ID</div>
						<div style={cellStyle}>Name</div>
						<div style={cellStyle}>Audio URL</div>
						<div style={cellStyle}>Created At</div>
					</div>
					{isFetchingProfiles ? (
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								justifyContent: "center",
								alignItems: "center",
								padding: "60px 30px",
								color: "#C9D6E2",
								gap: "16px",
							}}>
							<Loader2 className='h-8 w-8 animate-spin' />
							<span>Loading Profiles...</span>
						</div>
					) : filteredInmates.length === 0 ? (
						<div
							style={{
								padding: "60px 30px",
								textAlign: "center",
								color: "#C9D6E2",
							}}>
							{searchTerm
								? "No inmates found matching your search."
								: "No inmates added yet. Create one to get started."}
						</div>
					) : (
						filteredInmates.map((inmate, index) => (
							<div
								key={inmate.id}
								style={{
									padding: "20px 30px",
									borderBottom:
										index === filteredInmates.length - 1
											? "none"
											: "1px solid rgba(255,255,255,0.1)",
									display: "grid",
									gridTemplateColumns: "0.5fr 1.5fr 2fr 1.5fr",
									gap: "24px",
									alignItems: "center",
									color: "white",
								}}>
								<div style={cellStyle}>{inmate.id}</div>
								<div style={cellStyle}>{inmate.name}</div>
								<div style={cellStyle}>
									<a
										href={inmate.audioUrl}
										target='_blank'
										rel='noopener noreferrer'
										className='text-blue-400 hover:underline'
										onClick={(e) => e.stopPropagation()}>
										{inmate.audioUrl}
									</a>
								</div>
								<div style={cellStyle}>
									{new Date(inmate.createdAt).toLocaleString()}
								</div>
							</div>
						))
					)}
				</div>
				<br />
				<br />
				<div className='w-full flex flex-col lg:flex-row gap-8'>
					<div className='lg:w-2/3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white shadow-2xl shadow-black/50'>
						<div className='mb-6'>
							<h2 className='text-3xl font-bold'>Verification Reports</h2>
							<p className='text-gray-300'>
								Review the history of all voice analysis reports.
							</p>
						</div>
						<div className='h-[50vh] overflow-y-auto pr-2'>
							<ReportList reports={reports} isLoading={reportsLoading} />
						</div>
					</div>

					<div className='lg:w-1/3 space-y-6'>
						<div className='bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 text-white shadow-2xl shadow-black/50'>
							<div className='mb-6'>
								<h2 className='text-2xl font-bold'>Audio Analysis</h2>
								<p className='text-gray-300'>
									Upload audio file for voice verification
								</p>
							</div>

							<div className='space-y-4'>
								<div>
									<Label className='block text-sm font-medium mb-2'>
										Select Audio File
									</Label>
									<Input
										type='file'
										accept='audio/*'
										onChange={handleAudioUpload}
										className='w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30'
									/>
								</div>

								{selectedAudioFile && (
									<div className='p-3 bg-white/20 rounded-lg'>
										<p className='text-sm'>
											Selected: {selectedAudioFile.name}
										</p>
									</div>
								)}

								<Button
									onClick={handleSubmit}
									disabled={!selectedAudioFile}
									className='w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors'>
									Generate Report
								</Button>
							</div>
						</div>

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
										Compare suspect voice recordings with known inmate voice
										samples for identity verification
									</p>
								</div>

								<Button
									onClick={handleOpenInmateModal}
									className='w-full py-4 text-lg bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-green-500/25'>
									Select Inmate Suspect
								</Button>
							</div>
						</div>
					</div>
				</div>

				{showInmateModal && (
					<div
						className='fixed inset-0 z-50 flex items-center justify-center p-4'
						style={{ backgroundColor: "rgba(10, 37, 64, 0.9)" }}>
						<div
							className='text-white shadow-2xl max-w-5xl w-full max-h-[80vh] overflow-y-auto'
							style={{
								background: "rgba(255, 255, 255, 0.06)",
								border: "1px solid rgba(255,255,255,0.15)",
								borderRadius: "20px",
								padding: "32px",
								boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
							}}>
							<div className='mb-6 flex justify-between items-center'>
								<h2 className='text-2xl font-bold'>Select Inmate Suspect</h2>
								<Button
									onClick={() => setShowInmateModal(false)}
									className='text-gray-400 hover:text-white text-2xl bg-transparent hover:bg-transparent'>
									×
								</Button>
							</div>

							<div
								className='overflow-hidden mb-6'
								style={{
									background: "rgba(255, 255, 255, 0.06)",
									border: "1px solid rgba(255,255,255,0.15)",
									borderRadius: "20px",
									boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
								}}>
								{inmates.length > 0 ? (
									<div>
										{/* Table Header */}
										<div
											className='p-4 border-b'
											style={{
												background: "rgba(255,255,255,0.08)",
												borderBottom: "1px solid rgba(255,255,255,0.1)",
											}}>
											<div className='grid grid-cols-4 gap-4 text-sm font-semibold text-gray-300 uppercase tracking-wider'>
												<div>ID</div>
												<div>NAME</div>
												<div>AUDIO URL</div>
												<div>CREATED AT</div>
											</div>
										</div>
										{/* Table Rows */}
										<div>
											{inmates.map((inmate, index) => (
												<div
													key={inmate.id}
													onClick={() => handleInmateSelection(inmate)}
													className={`p-4 cursor-pointer transition-all ${
														index === inmates.length - 1 ? "" : "border-b"
													}`}
													style={{
														borderBottom:
															index === inmates.length - 1
																? "none"
																: "1px solid rgba(255,255,255,0.1)",
														backgroundColor:
															selectedInmate?.id === inmate.id
																? "rgba(59, 130, 246, 0.2)"
																: "transparent",
														...(selectedInmate?.id !== inmate.id && {
															":hover": {
																backgroundColor: "rgba(255,255,255,0.05)",
															},
														}),
													}}
													onMouseEnter={(e) => {
														if (selectedInmate?.id !== inmate.id) {
															e.currentTarget.style.backgroundColor =
																"rgba(255,255,255,0.05)";
														}
													}}
													onMouseLeave={(e) => {
														if (selectedInmate?.id !== inmate.id) {
															e.currentTarget.style.backgroundColor =
																"transparent";
														}
													}}>
													<div className='grid grid-cols-4 gap-4 items-center'>
														<div
															className='text-sm text-white truncate'
															title={inmate.id}>
															{inmate.id.substring(0, 12)}...
														</div>
														<div className='text-sm text-white font-medium'>
															{inmate.name}
														</div>
														<div className='text-sm'>
															<a
																href={inmate.audioUrl}
																target='_blank'
																rel='noopener noreferrer'
																className='text-blue-400 hover:text-blue-300 hover:underline truncate block'
																title={inmate.audioUrl}
																onClick={(e) => e.stopPropagation()}>
																{inmate.audioUrl.split("/").pop() ||
																	inmate.audioUrl}
															</a>
														</div>
														<div className='text-sm text-gray-300'>
															{new Date(inmate.createdAt).toLocaleDateString()}
														</div>
													</div>
												</div>
											))}
										</div>
									</div>
								) : (
									<div className='p-8 text-center'>
										<p className='text-gray-400 text-lg'>
											No inmates available
										</p>
										<p className='text-gray-500 text-sm mt-2'>
											Inmates will appear here when added to the system
										</p>
									</div>
								)}
							</div>

							{selectedInmate && (
								<div
									className='pt-6'
									style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
									<h3 className='text-xl font-bold mb-4'>
										Voice Analysis for {selectedInmate.name}
									</h3>

									<div className='space-y-4'>
										<div>
											<Label className='block text-sm font-medium mb-2'>
												Upload Suspect Audio
											</Label>
											<input
												type='file'
												accept='audio/*'
												onChange={handleSuspectAudioUpload}
												className='w-full p-3 border rounded-lg text-white'
												style={{
													backgroundColor: "rgba(255,255,255,0.1)",
													borderColor: "rgba(255,255,255,0.2)",
													fontSize: "14px",
													cursor: "pointer",
												}}
											/>
										</div>

										{selectedSuspectAudio && (
											<div
												className='p-3 rounded-lg'
												style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
												<p className='text-sm'>
													Selected: {selectedSuspectAudio.name}
												</p>
											</div>
										)}

										<div className='flex gap-4'>
											<Button
												onClick={handleSuspectReportGenerate}
												disabled={!selectedSuspectAudio || isGeneratingReport}
												className='flex-1 py-3 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors'
												style={{
													backgroundColor:
														!selectedSuspectAudio || isGeneratingReport
															? "#6b7280"
															: "#16a34a",
												}}
												onMouseEnter={(e) => {
													if (!e.currentTarget.disabled) {
														e.currentTarget.style.backgroundColor = "#15803d";
													}
												}}
												onMouseLeave={(e) => {
													if (!e.currentTarget.disabled) {
														e.currentTarget.style.backgroundColor = "#16a34a";
													}
												}}>
												{isGeneratingReport && (
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
												)}
												{isGeneratingReport
													? "Generating Report..."
													: "Generate Comparison Report"}
											</Button>

											<Button
												onClick={() => {
													setShowInmateModal(false);
													setSelectedInmate(null);
													setSelectedSuspectAudio(null);
												}}
												disabled={isGeneratingReport}
												className='px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50'
												style={{ backgroundColor: "#6b7280" }}
												onMouseEnter={(e) => {
													if (!e.currentTarget.disabled) {
														e.currentTarget.style.backgroundColor = "#4b5563";
													}
												}}
												onMouseLeave={(e) => {
													if (!e.currentTarget.disabled) {
														e.currentTarget.style.backgroundColor = "#6b7280";
													}
												}}>
												Cancel
											</Button>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</>
	);
}
