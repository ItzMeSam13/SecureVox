import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

// src/utils/audioUtils.js
export async function fetchAudioFromCloudinary(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Failed to download audio from Cloudinary: ${response.statusText}`
			);
		}
		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	} catch (error) {
		console.error("Error fetching audio from Cloudinary:", error);
		throw error;
	}
}
