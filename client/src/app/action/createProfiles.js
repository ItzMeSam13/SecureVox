"use server";

import { CreateInmates } from "../service/createInmates";
import { writeFile } from "fs/promises";
import { join } from "path";

export default async function Inmates(formData) {
	const name = formData.get("name");
	const audioFile = formData.get("audioFile");

	if (!name || !audioFile) {
		return { success: false, error: "Name and audio file are required." };
	}

	try {
		const fileBuffer = await audioFile.arrayBuffer();
		const buffer = Buffer.from(fileBuffer);

		const flaskFormData = new FormData();
		const audioBlob = new Blob([buffer], { type: audioFile.type });
		flaskFormData.append("file", audioBlob, audioFile.name);

		const flaskPromise = fetch("http://127.0.0.1:5000/hash", {
			method: "POST",
			body: flaskFormData,
		});

		const flaskResponse = await flaskPromise;

		if (!flaskResponse.ok) throw new Error("Flask processing failed.");
		const mlData = await flaskResponse.json();

		// Save the audio file to the local file system
		const fileName = `${Date.now()}_${audioFile.name}`;
		const filePath = join(process.cwd(), "public/audio", fileName);
		await writeFile(filePath, buffer);

		// Store the local path in the database
		const audioUrl = `/audio/${fileName}`;

		const dataToSave = {
			name: name,
			audioUrl: audioUrl,
			hash: mlData.hash_sha256 || "N/A",
		};

		const newInmate = await CreateInmates(dataToSave);

		return { success: true, newInmate: newInmate };
	} catch (error) {
		console.error("Error in Inmates action:", error);
		return { success: false, error: error.message };
	}
}
