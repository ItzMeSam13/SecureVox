"use client";

import { useState, useCallback, useEffect } from "react";
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
import { GetAllInmates } from "@/app/service/createInmates";

export default function Profiles() {
	const [inmates, setInmates] = useState([]);
	const [isFetching, setIsFetching] = useState(true);
	const [formData, setFormData] = useState({ name: "", audioFile: null });
	const [searchTerm, setSearchTerm] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		const fetchInmates = async () => {
			try {
				const data = await GetAllInmates();
				setInmates(data || []);
			} catch (error) {
				console.error("Failed to fetch inmates:", error);
				setInmates([]);
			} finally {
				setIsFetching(false);
			}
		};

		fetchInmates();
	}, []);

	const handleInputChange = (field) => (e) => {
		if (field === "audioFile") {
			setFormData((prev) => ({ ...prev, [field]: e.target.files[0] }));
		} else {
			setFormData((prev) => ({ ...prev, [field]: e.target.value }));
		}
	};

	const handleAddInmate = useCallback(async () => {
		if (!formData.name || !formData.audioFile) {
			alert("Please fill in all required fields");
			return;
		}
		setIsLoading(true);
		try {
			const dataToSend = new FormData();
			dataToSend.append("name", formData.name);
			dataToSend.append("audioFile", formData.audioFile);
			const result = await Inmates(dataToSend);
			if (!result.success) {
				throw new Error(result.error);
			}
			setInmates((prev) => [...prev, result.newInmate]);
			setFormData({ name: "", audioFile: null });
			setIsOpen(false);
		} catch (error) {
			console.error("Error creating inmate:", error);
			alert(`An error occurred: ${error.message}`);
		} finally {
			setIsLoading(false);
		}
	}, [formData]);

	const handleInmateClick = (inmate) => {
		console.log("Inmate clicked:", inmate);
	};

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

	return (
		<div
			style={{
				fontFamily: "Arial, sans-serif",
				backgroundColor: "#0A2540",
				minHeight: "100vh",
				padding: "40px",
			}}>
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
					<Dialog open={isOpen} onOpenChange={setIsOpen}>
						<DialogTrigger asChild>
							<Button className='bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-semibold'>
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
										value={formData.name}
										onChange={handleInputChange("name")}
										disabled={isLoading}
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
										onChange={handleInputChange("audioFile")}
										disabled={isLoading}
										className='bg-slate-800/50 border-slate-600 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 mt-2'
									/>
									{formData.audioFile && (
										<p className='text-sm text-slate-400 mt-2'>
											Selected: {formData.audioFile.name}
										</p>
									)}
								</div>
								<div className='flex gap-3 pt-6'>
									<Button
										variant='secondary'
										onClick={() => setIsOpen(false)}
										disabled={isLoading}
										className='flex-1 bg-slate-700 text-white hover:bg-slate-600'>
										Cancel
									</Button>
									<Button
										onClick={handleAddInmate}
										disabled={isLoading}
										className='flex-1 bg-blue-600 hover:bg-blue-700'>
										{isLoading && (
											<Loader2 className='mr-2 h-4 w-4 animate-spin' />
										)}
										{isLoading ? "Processing..." : "Create"}
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
				{isFetching ? (
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
							}}
							onClick={() => handleInmateClick(inmate)}>
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
								{new Date(inmate.createdAt).toLocaleDateString()}
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
