import { db } from "@/Firebase/config";
import {
	addDoc,
	collection,
	getDocs,
	serverTimestamp,
	query,
} from "firebase/firestore";

export async function CreateReports(data) {
	const ref = collection(db, "reports");
	await addDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function GetAllReports() {
	try {
		const reportsCollectionRef = collection(db, "reports");
		const q = query(reportsCollectionRef);

		const querySnapshot = await getDocs(q);

		const reports = [];
		querySnapshot.forEach((doc) => {
			reports.push({ id: doc.id, ...doc.data() });
		});

		return { success: true, reports: reports };
	} catch (error) {
		console.error("Error fetching reports:", error);
		return { success: false, error: error.message };
	}
}
