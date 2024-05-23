import { firebase } from '../firebase/firebase';

const addCastToDB = async (cast: any) => {
	// get the cast has
	const hash = cast.hash;

	// get the user fid
	const fid = cast.fid;

	console.log(`=============================== \nAdding cast to the database with following details: \nHash: ${hash} \nFid: ${fid}`);
	// prepare the db reference

	const castsRef = firebase.db.collection('casts');
	const castRef = castsRef.doc(hash);

	try {
		// add the data to the db
		await castRef.set({
			...cast,
			lastSyncedAt: firebase.FieldValue.serverTimestamp(),
			timestamp: firebase.FieldValue.serverTimestamp(),
		});

		console.log('Cast added to the database successfully');
	} catch (error) {
		console.error('Error adding cast to the database:', error);
	}
};

export { addCastToDB };
