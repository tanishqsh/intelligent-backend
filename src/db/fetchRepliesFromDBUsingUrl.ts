import { firebase } from '../firebase/firebase';

const fetchRepliesFromDBUsingUrl = async (castUrl: string, limit: number = 50, startAfter: any = null) => {
	let casts: any[] = [];
	console.log('Fetching replies from the database for the following URL: ', castUrl);
	let castRef = firebase.db.collection('replies').where('parentCast.url', '==', castUrl).limit(limit);

	if (startAfter) {
		castRef = castRef.startAfter(startAfter);
	}

	const snapshot = await castRef.get();

	if (snapshot.empty) {
		return null;
	}

	snapshot.forEach((doc) => {
		// add the data to the array
		casts.push(doc.data());
	});

	const lastVisible = snapshot.docs[snapshot.docs.length - 1];

	return {
		casts,
		lastVisible,
		hasMore: snapshot.size === limit,
	};
};

export { fetchRepliesFromDBUsingUrl };
