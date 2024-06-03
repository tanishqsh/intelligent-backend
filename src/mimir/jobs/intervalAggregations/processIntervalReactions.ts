import { firebase } from '../../../firebase/firebase';
import { query } from '../../mimir';
import { getIntervalReactionsCount } from '../../sql/reactionsQueries';

const processIntervalReactions = async (fid: number) => {
	console.log('Processing Job: Interval Reactions Worker for FID:', fid);
	const q = getIntervalReactionsCount(fid);
	const start = Date.now();
	const { rows } = await query(q);
	const duration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`✅ Duration [IntervalReactionsWorker-${fid}]: ${duration}ms`);

	// add reactions interval count to firebase
	try {
		const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());

		await userStatRef.set(
			{
				reactions_stat: {
					reactions_24h: rows[0].reactions_24h,
					reactions_prev_24h: rows[0].reactions_prev_24h,
					reactions_7d: rows[0].reactions_7d,
					reactions_prev_7d: rows[0].reactions_prev_7d,
					reactions_30d: rows[0].reactions_30d,
					reactions_prev_30d: rows[0].reactions_prev_30d,
					reactions_180d: rows[0].reactions_180d,
					reactions_prev_180d: rows[0].reactions_prev_180d,
				},
			},
			{ merge: true }
		);
	} catch (error) {
		console.error('Error adding reactions interval count to Firebase:', error);
	}
};

export default processIntervalReactions;
