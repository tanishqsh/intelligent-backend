import { fetchQuery } from '@airstack/node';
import { firebase } from '../firebase/firebase';
import { getUserByFID } from '../utils/airstack-query-constructors/getUserByFID';

/**
 * NOT IN USE
 *  this functions gets all the current subscribers of a channel, then fetches their user data from Airstack and updates Firebase with the fetched data
 */

async function completeAFSubs({ fid }: { fid: number }) {
	if (!fid) {
		console.log('completeAFSubs: fid is required');
		return;
	}

	let subscribers: any = [];

	const db = firebase.db;
	console.log('completeAFSubs: fid:', fid);

	const collectionRef = db.collection('users').doc(fid.toString()).collection('alfafrensMembers');

	// Step 1: Get all documents in the collection where isSubscribed is true
	try {
		const snapshot = await collectionRef.where('isSubscribed', '==', true).get();
		snapshot.forEach((doc) => {
			subscribers.push(doc.data().fid);
		});
	} catch (err) {
		console.error('Error getting documents', err);
		return; // exit the function if there's an error
	}

	console.log('completeAFSubs: subscribers:', subscribers);

	// Step 2: For each subscriber, get their user data from Airstack
	for (let i = 0; i < subscribers.length; i++) {
		let subscriber = subscribers[i];
		console.log('completeAFSubs: subscriber:', subscriber);

		let query = getUserByFID(subscriber);

		try {
			const result = await fetchQuery(query);
			const userData = result?.data?.Socials?.Social[0];

			// Step 3: Update Firebase with the fetched user data
			if (userData) {
				const subscriberDocRef = collectionRef.doc(subscriber);
				await subscriberDocRef.set(
					{
						fc_data: userData,
						lastSyncedAt: firebase.FieldValue.serverTimestamp(),
					},
					{ merge: true }
				);
				console.log(`completeAFSubs: Updated subscriber ${subscriber} with userData`);
			}
		} catch (error) {
			console.error('completeAFSubs: error fetching user data for subscriber', subscriber, error);
		}
	}
}

export { completeAFSubs };
