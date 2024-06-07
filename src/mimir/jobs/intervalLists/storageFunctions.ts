import { firebase } from '../../../firebase/firebase';

const storeImpactFollowersInFirebase = async (fid: number, rows: any[], durationLabel: string) => {
	const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());
	const batch = firebase.db.batch();
	rows.forEach((row, index) => {
		const impactFollowersRef = userStatRef.collection(`impact_followers_${durationLabel}`).doc(index.toString());
		batch.set(impactFollowersRef, row, { merge: true });
	});
	await batch.commit();
	console.log(`📦 [IntervalListsWorker] Impact Followers stored in Firebase for FID: ${fid}, Label: ${durationLabel}`);
};

const storeTopCastsInFirebase = async (fid: number, rows: any[], durationLabel: string) => {
	const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());
	const batch = firebase.db.batch();
	rows.forEach((row, index) => {
		const topCastRef = userStatRef.collection(`top_casts_${durationLabel}`).doc(index.toString());
		batch.set(topCastRef, row, { merge: true });
	});
	await batch.commit();
	console.log(`📦 [IntervalListsWorker] Top casts stored in Firebase for FID: ${fid}, Label: ${durationLabel}`);
};

const storeImpactUnfollowersInFirebase = async (fid: number, rows: any[], durationLabel: string) => {
	const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());
	const batch = firebase.db.batch();
	rows.forEach((row, index) => {
		const impactUnfollowersRef = userStatRef.collection(`impact_unfollowers_${durationLabel}`).doc(index.toString());
		batch.set(impactUnfollowersRef, row, { merge: true });
	});
	await batch.commit();
	console.log(`📦 [IntervalListsWorker] Impact Unfollowers stored in Firebase for FID: ${fid}, Label: ${durationLabel}`);
};

const storeTopMentionsInFirebase = async (fid: number, rows: any[], durationLabel: string) => {
	const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());
	const batch = firebase.db.batch();
	rows.forEach((row, index) => {
		const topMentionsRef = userStatRef.collection(`top_mentions_${durationLabel}`).doc(index.toString());
		batch.set(topMentionsRef, row, { merge: true });
	});
	await batch.commit();
	console.log(`📦 [IntervalListsWorker] Top mentions stored in Firebase for FID: ${fid}, Label: ${durationLabel}`);
};

export { storeImpactFollowersInFirebase, storeTopCastsInFirebase, storeImpactUnfollowersInFirebase, storeTopMentionsInFirebase };
