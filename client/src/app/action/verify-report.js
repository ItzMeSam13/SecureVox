"use server";

import { GetAllInmates } from "../service/createInmates";
import { CreateReports } from "../service/reports";
import { readFile, writeFile } from "fs/promises";
import { join } from "path";

export default async function VerifyAndReport(formData) {
	const uploadedAudioFile = formData.get("audioFile");

	if (!uploadedAudioFile) {
		return { success: false, error: "Audio file is required." };
	}

	try {
		const allInmates = await GetAllInmates();

		let matchedInmate = null;
		let inmateAudioFile = null;

		for (const inmate of allInmates) {
			const inmatesAudioUrl = inmate.audioUrl;

			try {
				const audioPath = join(process.cwd(), "public", inmatesAudioUrl);
				const audioBuffer = await readFile(audioPath);

				const flaskVerifyFormData = new FormData();
				flaskVerifyFormData.append(
					"audio1",
					new File([audioBuffer], inmate.name + ".mp3", { type: "audio/mpeg" })
				);
				flaskVerifyFormData.append(
					"audio2",
					uploadedAudioFile,
					uploadedAudioFile.name
				);

				const verifyResponse = await fetch("http://127.0.0.1:5000/verify", {
					method: "POST",
					body: flaskVerifyFormData,
				});

				if (verifyResponse.ok) {
					const verifyResult = await verifyResponse.json();
					if (verifyResult.same_speaker) {
						matchedInmate = inmate;
						inmateAudioFile = new File([audioBuffer], inmate.name + ".mp3", {
							type: "audio/mpeg",
						});
						break;
					}
				} else {
					console.warn(
						`Verification failed for inmate ${inmate.id} with status ${
							verifyResponse.status
						}: ${await verifyResponse.text()}`
					);
				}
			} catch (fileError) {
				console.error(
					`Error processing audio for inmate ${inmate.id}: ${fileError.message}`
				);
				continue;
			}
		}

		let inmateId;
		let originalAudioToReport;

		if (matchedInmate) {
			inmateId = matchedInmate.id;
			originalAudioToReport = inmateAudioFile;
		} else {
			inmateId = "N/A";
			// ⬅️ Correcting the path for the fallback audio file
			const silentAudioPath = join(
				process.cwd(),
				"public/static-audio/blank.mp3"
			);
			const silentAudioBuffer = await readFile(silentAudioPath);
			originalAudioToReport = new File([silentAudioBuffer], "blank.mp3", {
				type: "audio/mpeg",
			});
		}

		const flaskReportFormData = new FormData();
		flaskReportFormData.append(
			"original_audio",
			originalAudioToReport,
			originalAudioToReport.name
		);
		flaskReportFormData.append(
			"suspected_audio",
			uploadedAudioFile,
			uploadedAudioFile.name
		);

		const flaskReportResponse = await fetch(
			"http://127.0.0.1:5000/generate-report",
			{
				method: "POST",
				body: flaskReportFormData,
			}
		);

		if (!flaskReportResponse.ok) {
			const errorText = await flaskReportResponse.text();
			throw new Error(`Flask report generation failed: ${errorText}`);
		}

		const pdfBuffer = await flaskReportResponse.arrayBuffer();
		const pdfHeader = new Uint8Array(pdfBuffer.slice(0, 4));
		const isPdf = String.fromCharCode(...pdfHeader) === "%PDF";

		if (!isPdf) {
			const textResponse = new TextDecoder().decode(pdfBuffer);
			throw new Error(`Expected a PDF but got non-PDF content from Flask.`);
		}

		const fileName = `report_${inmateId.replace(/\//g, "-")}_${Date.now()}.pdf`;

		const filePath = join(process.cwd(), "public/reports", fileName);
		await writeFile(filePath, Buffer.from(pdfBuffer));
		const reportPdfUrl = `/reports/${fileName}`;

		const dataToSave = {
			suspectId: inmateId,
			reportPdfUrl: reportPdfUrl,
			uploadedAudioHash: "N/A",
			createdAt: new Date().toISOString(),
		};

		const newReport = await CreateReports(dataToSave);
		return { success: true, newReport: newReport };
	} catch (error) {
		console.error("Error in VerifyAndReport action:", error);
		return { success: false, error: error.message };
	}
}
