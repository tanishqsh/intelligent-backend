import { firebase } from '../../../firebase/firebase';
import { query } from '../../mimir';
import { getIntervalFollowerCount } from '../../sql/followersQueries';

const processIntervalFollowerCount = async (fid: number) => {
	console.log('Processing Job: Interval Follower-Count Worker for FID:', fid);
	const q = getIntervalFollowerCount(fid);
	const start = Date.now();
	const { rows } = await query(q);
	const duration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`✅ Duration [IntervalFollowerCountWorker-${fid}]: ${duration}ms`);

	// add reactions interval count to firebase
	try {
		const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());

		await userStatRef.set(
			{
				followers_stat: {
					gain_24h: rows[0].followers_gain_24h,
					gain_prev_24h: rows[0].followers_gain_prev_24h,
					gain_7d: rows[0].followers_gain_7d,
					gain_prev_7d: rows[0].followers_gain_prev_7d,
					gain_30d: rows[0].followers_gain_30d,
					gain_prev_30d: rows[0].followers_gain_prev_30d,
					gain_180d: rows[0].followers_gain_180d,
					gain_prev_180d: rows[0].followers_gain_prev_180d,
				},
			},
			{ merge: true }
		);
	} catch (error) {
		console.error('Error adding follower count interval to Firebase:', error);
	}
};

export default processIntervalFollowerCount;
