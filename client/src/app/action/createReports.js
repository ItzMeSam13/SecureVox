// createReports.js
"use server";

import { CreateReports } from "../service/reports";
import { GetInmateById } from "../service/createInmates";
import { fetchAudioFromCloudinary } from "@/lib/utils";
import cloudinary from "@/lib/cloudinary"; // Use your existing config

// Helper function to convert a File to a Buffer
async function fileToBuffer(file) {
	const fileBuffer = await file.arrayBuffer();
	return Buffer.from(fileBuffer);
}

// Helper function to upload PDF to Cloudinary
async function uploadPdfToCloudinary(pdfBuffer, fileName) {
	return new Promise((resolve, reject) => {
		cloudinary.uploader
			.upload_stream(
				{
					resource_type: "raw", // Use "raw" for PDF files
					public_id: `reports/${fileName}`,
					format: "pdf",
				},
				(error, result) => {
					if (error) {
						reject(error);
					} else {
						resolve(result.secure_url);
					}
				}
			)
			.end(pdfBuffer);
	});
}

export default async function GenerateReports(formData) {
	const inmateId = formData.get("inmateId");
	const uploadedAudioFile = formData.get("audioFile");

	if (!inmateId || !uploadedAudioFile) {
		return { success: false, error: "Inmate ID and audio file are required." };
	}

	try {
		const inmate = await GetInmateById(inmateId);
		if (!inmate || !inmate.audioUrl) {
			return { success: false, error: "Inmate audio profile not found." };
		}
		const inmatesAudioUrl = inmate.audioUrl;

		const inmatesAudioBuffer = await fetchAudioFromCloudinary(inmatesAudioUrl);
		const inmatesAudioBlob = new Blob([inmatesAudioBuffer], {
			type: "audio/mp3",
		});

		const uploadedAudioBuffer = await fileToBuffer(uploadedAudioFile);
		const uploadedAudioBlob = new Blob([uploadedAudioBuffer], {
			type: uploadedAudioFile.type,
		});

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

		const flaskResponse = await fetch("http://127.0.0.1:5000/generate-report", {
			method: "POST",
			body: flaskFormData,
		});

		if (!flaskResponse.ok) {
			const errorText = await flaskResponse.text();
			throw new Error(`Flask report generation failed: ${errorText}`);
		}

		// Always assume the response is a PDF since your Flask endpoint returns PDF
		const pdfBuffer = await flaskResponse.arrayBuffer();

		// Check if it's actually a PDF by looking at the first few bytes
		const pdfHeader = new Uint8Array(pdfBuffer.slice(0, 4));
		const isPdf = String.fromCharCode(...pdfHeader) === "%PDF";

		if (!isPdf) {
			// If it's not a PDF, try to parse as text to see the error
			const textResponse = new TextDecoder().decode(pdfBuffer);
			throw new Error(
				`Expected PDF but got: ${textResponse.substring(0, 100)}...`
			);
		}

		// Upload PDF to Cloudinary
		const fileName = `report_${inmateId}_${Date.now()}`;
		const pdfUrl = await uploadPdfToCloudinary(
			Buffer.from(pdfBuffer),
			fileName
		);

		const dataToSave = {
			inmateId: inmateId,
			reportPdfUrl: pdfUrl,
			uploadedAudioHash: null, // Generate this if needed
			createdAt: new Date().toISOString(),
		};

		const newReport = await CreateReports(dataToSave, inmateId);
		return { success: true, newReport: newReport };
	} catch (error) {
		console.error("Error in GenerateReports action:", error);
		return { success: false, error: error.message };
	}
}
