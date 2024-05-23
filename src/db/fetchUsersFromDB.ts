import { firebase } from '../firebase/firebase';

const fetchUsersFromDB = async () => {
	let users: any[] = [];
	const snapshot = await firebase.db.collection('users').get();
	snapshot.forEach((doc) => {
		users.push(parseInt(doc.id));
	});
	return users;
};

export default fetchUsersFromDB;
