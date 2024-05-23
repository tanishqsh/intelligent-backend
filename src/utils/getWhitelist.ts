/**
 * Retrieves the whitelist from the 'whitelist' collection in the Firebase database.
 *
 * This function fetches all documents from the 'whitelist' collection and extracts their IDs.
 * The IDs are then stored in an array called 'whitelist' and returned.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of whitelist IDs.
 */
import { firebase } from '../firebase/firebase';

const getWhitelist = async () => {
	let whitelist: string[] = [];
	const snapshot = await firebase.db.collection('whitelist').get();
	snapshot.forEach((doc) => {
		whitelist.push(doc.get('fid'));
	});

	return whitelist;
};

export default getWhitelist;
