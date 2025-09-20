import { db } from "@/Firebase/config";
import {
	addDoc,
	collection,
	getDocs,
	serverTimestamp,
} from "firebase/firestore";

export async function CreateReports(data, Id) {
	const ref = collection(db, "reports");
	await addDoc(ref, { ...data, suspectId: Id, createdAt: serverTimestamp() });
}
