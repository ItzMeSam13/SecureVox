"use server";

import { CreateReports } from "../service/reports";
import { GetInmateById } from "../service/createInmates";
import { writeFile } from "fs/promises";
import { join } from "path";

// Helper function to convert a File to a Buffer
async function fileToBuffer(file) {
	const fileBuffer = await file.arrayBuffer();
	return Buffer.from(fileBuffer);
}

export default async function GenerateReports(formData) {
	const inmateId = formData.get("inmateId");
	const uploadedAudioFile = formData.get("audioFile");

	if (!inmateId || !uploadedAudioFile) {
		return {
			success: false,
			error: "Select Inmate and audio file are required.",
		};
	}

	try {
		// Prepare the uploaded audio buffer and blob once
		const uploadedAudioBuffer = await fileToBuffer(uploadedAudioFile);
		const uploadedAudioBlob = new Blob([uploadedAudioBuffer], {
			type: uploadedAudioFile.type,
		});

		// Start two async operations concurrently
		const [inmate, hashResponse] = await Promise.all([
			GetInmateById(inmateId),
			(async () => {
				const HashFormData = new FormData();
				HashFormData.append("file", uploadedAudioBlob, uploadedAudioFile.name);
				return fetch("http://127.0.0.1:5000/hash", {
					method: "POST",
					body: HashFormData,
				});
			})(),
		]);

		if (!inmate || !inmate.audioUrl) {
			throw new Error("Inmate audio profile not found.");
		}

		if (!hashResponse.ok) {
			throw new Error("Hashing uploaded audio failed.");
		}
		const mlData = await hashResponse.json();

		// The original `audioUrl` is now a local path
		const inmatesAudioUrl = inmate.audioUrl;
		const originalAudioResponse = await fetch(
			`http://localhost:3000${inmatesAudioUrl}`
		);

		if (!originalAudioResponse.ok) {
			throw new Error("Failed to download inmate audio locally.");
		}
		const inmatesAudioBuffer = await originalAudioResponse.arrayBuffer();
		const inmatesAudioBlob = new Blob([inmatesAudioBuffer], {
			type: "audio/mpeg",
		});

		// Prepare data for the Flask report generation service
		const flaskFormData = new FormData();
		flaskFormData.append(
			"original_audio",
			inmatesAudioBlob,
			"inmate_audio.mp3"
		);
		flaskFormData.append(
			"suspected_audio",
			uploadedAudioBlob,
			uploadedAudioFile.name
		);

		// Generate the report
		const flaskResponse = await fetch("http://127.0.0.1:5000/generate-report", {
			method: "POST",
			body: flaskFormData,
		});

		if (!flaskResponse.ok) {
			const errorText = await flaskResponse.text();
			throw new Error(`Flask report generation failed: ${errorText}`);
		}

		const pdfBuffer = await flaskResponse.arrayBuffer();
		const pdfHeader = new Uint8Array(pdfBuffer.slice(0, 4));
		const isPdf = String.fromCharCode(...pdfHeader) === "%PDF";

		if (!isPdf) {
			const textResponse = new TextDecoder().decode(pdfBuffer);
			throw new Error(`Expected a PDF but got non-PDF content from Flask.`);
		}

		const fileName = `report_${inmateId}_${Date.now()}.pdf`;
		const filePath = join(process.cwd(), "public/reports", fileName);

		// Write the PDF buffer directly to the local file system
		await writeFile(filePath, Buffer.from(pdfBuffer));

		// The URL is now a local, public path
		const reportPdfUrl = `/reports/${fileName}`;

		const dataToSave = {
			Suspectname: inmate.name,
			suspectId: inmateId,
			reportPdfUrl: reportPdfUrl,
			uploadedAudioHash: mlData.hash_sha256 || "N/A",
			createdAt: new Date().toISOString(),
		};

		const newReport = await CreateReports(dataToSave);
		return { success: true, newReport: newReport };
	} catch (error) {
		console.error("Error in GenerateReports action:", error);
		return { success: false, error: error.message };
	}
}
