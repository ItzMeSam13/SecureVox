"use server";

import cloudinary from "@/lib/cloudinary";
import { CreateInmates } from "../service/createInmates";

export default async function Inmates(formData) {
	const name = formData.get("name");
	const audioFile = formData.get("audioFile");

	if (!name || !audioFile) {
		return { success: false, error: "Name and audio file are required." };
	}

	try {
		const fileBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(fileBuffer);

		const cloudinaryPromise = new Promise((resolve, reject) => {
			const uploadStream = cloudinary.uploader.upload_stream(
				{ resource_type: "auto" },
				(error, result) => {
					if (error) reject(new Error("Cloudinary upload failed."));
					else resolve(result);
				}
			);
			uploadStream.end(buffer);
		});

		const flaskFormData = new FormData();
		const audioBlob = new Blob([buffer], { type: audioFile.type });
		flaskFormData.append("file", audioBlob, audioFile.name);

		const flaskPromise = fetch("http://127.0.0.1:5000/hash", {
			method: "POST",
			body: flaskFormData,
		});

		const [cloudinaryResult, flaskResponse] = await Promise.all([
			cloudinaryPromise,
			flaskPromise,
		]);

		if (!flaskResponse.ok) throw new Error("Flask processing failed.");
		const mlData = await flaskResponse.json();

		const dataToSave = {
			name: name,
			audioUrl: cloudinaryResult.secure_url,
			hash: mlData.hash_sha256 || "N/A",
		};

		const newInmate = await CreateInmates(dataToSave);

		return { success: true, newInmate: newInmate };
	} catch (error) {
		console.error("Error in Inmates action:", error);
		return { success: false, error: error.message };
	}
}
