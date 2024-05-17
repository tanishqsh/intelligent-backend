import { firebase } from '../firebase/firebase';

const addRepliesToDB = async (replies: any) => {
	// run a loop to add each reply to the database
	for (let reply of replies) {
		// get the reply hash
		const hash = reply.hash;

		console.log('=============================== ');
		console.log('Adding reply to the database with following details: ');
		console.log('Hash: ', hash);

		// prepare the db reference
		const repliesRef = firebase.db.collection('replies');
		const replyRef = repliesRef.doc(hash);

		console.log('DB reference: ', replyRef.path);

		try {
			// add the data to the db
			await replyRef.set({
				...reply,
				lastSyncedAt: firebase.FieldValue.serverTimestamp(),
				timestamp: firebase.FieldValue.serverTimestamp(),
			});

			console.log('Reply added to the database successfully');
			console.log('=============================== ');
		} catch (error) {
			console.error('Error adding reply to the database:', error);
			console.log('=============================== ');
		}
	}
};

export { addRepliesToDB };
