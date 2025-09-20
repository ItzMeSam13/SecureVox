import { db } from "@/Firebase/config";
import { addDoc, collection } from "firebase/firestore";
export default async function CreateUsers(data) {
	const ref = collection(db, "users");
	await addDoc(ref, data);
}
