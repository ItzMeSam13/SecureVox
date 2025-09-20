// service/createInmates.js

import { db } from "@/Firebase/config";
import {
	doc,
	addDoc,
	collection,
	getDocs,
	getDoc,
	serverTimestamp,
} from "firebase/firestore";

export async function CreateInmates(data) {
	const ref = collection(db, "inmates");
	const docRef = await addDoc(ref, { ...data, createdAt: serverTimestamp() });
}

export async function GetAllInmates() {
	const inmatesCollectionRef = collection(db, "inmates");
	const querySnapshot = await getDocs(inmatesCollectionRef);

	if (querySnapshot.empty) {
		return [];
	}

	const inmatesList = querySnapshot.docs.map((doc) => {
		const data = doc.data();
		return {
			id: doc.id,
			...data,
			createdAt:
				data.createdAt?.toDate().toISOString() || new Date().toISOString(),
		};
	});

	return inmatesList;
}

export async function GetInmateById(inmateId) {
	try {
		const inmateRef = doc(db, "inmates", inmateId);
		const inmateSnap = await getDoc(inmateRef);

		if (inmateSnap.exists()) {
			return { id: inmateSnap.id, ...inmateSnap.data() };
		} else {
			console.log("No such inmate found!");
			return null;
		}
	} catch (error) {
		console.error("Error getting inmate by ID:", error);
		throw new Error("Failed to retrieve inmate data.");
	}
}
