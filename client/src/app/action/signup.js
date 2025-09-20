import CreateUsers from "../service/createUsers";

export default async function signup(FormData) {
	const data = {
		name: FormData.name,
		email: FormData.email,
		policeId: FormData.policeId,
	};
	await CreateUsers(data);
}
