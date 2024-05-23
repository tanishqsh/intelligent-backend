import { firebase } from '../firebase/firebase';

const addUserToDB = async (user: any) => {
	// prepare the db reference
	const usersRef = firebase.db.collection('users');
	const userRef = usersRef.doc(user.fid.toString());

	// if the user is already present in the database, update the lastSyncedAt field
	const userSnapshot = await userRef.get();

	if (userSnapshot.exists) {
		console.log('User already exists in the database. Updating lastSyncedAt field');
		try {
			await userRef.update({
				...user,
				lastSyncedAt: firebase.FieldValue.serverTimestamp(),
			});
			console.log('User updated successfully');
		} catch (error) {
			console.error('Error updating user in the database:', error);
		}
	} else {
		try {
			// add the data to the db with merge option
			await userRef.set(
				{
					...user,
					lastSyncedAt: firebase.FieldValue.serverTimestamp(),
					timestamp: firebase.FieldValue.serverTimestamp(),
				},
				{ merge: true }
			);

			console.log('User added to the database successfully');
		} catch (error) {
			console.error('Error adding user to the database:', error);
		}
	}
};

export { addUserToDB };
