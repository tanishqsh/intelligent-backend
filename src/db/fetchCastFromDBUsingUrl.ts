import { firebase } from '../firebase/firebase';

const fetchCastFromDBUsingUrl = async (castUrl: string) => {
	const castRef = firebase.db.collection('casts').where('url', '==', castUrl);
	const snapshot = await castRef.get();

	if (snapshot.empty) {
		return null;
	}

	let castData: any;

	snapshot.forEach((doc) => {
		castData = doc.data();
	});

	return castData;
};

export { fetchCastFromDBUsingUrl };
