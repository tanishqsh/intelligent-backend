import { firebase } from '../../../firebase/firebase';
import { query } from '../../mimir';
import { getIntervalMentionsCount } from '../../sql/mentionsQueries';

const processIntervalMentions = async (fid: number) => {
	console.log('Processing Job: Interval Mentions Worker for FID:', fid);
	const q = getIntervalMentionsCount(fid);
	const start = Date.now();
	const { rows } = await query(q);
	const duration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`✅ Duration [IntervalMentionsWorker-${fid}]: ${duration}ms`);

	// add reactions interval count to firebase
	try {
		const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());

		await userStatRef.set(
			{
				mentions_stat: {
					mentions_24h: rows[0].mentions_24h,
					mentions_prev_24h: rows[0].mentions_prev_24h,
					mentions_7d: rows[0].mentions_7d,
					mentions_prev_7d: rows[0].mentions_prev_7d,
					mentions_30d: rows[0].mentions_30d,
					mentions_prev_30d: rows[0].mentions_prev_30d,
					mentions_180d: rows[0].mentions_180d,
					mentions_prev_180d: rows[0].mentions_prev_180d,
				},
			},
			{ merge: true }
		);
	} catch (error) {
		console.error('Error adding mentions interval count to Firebase:', error);
	}
};

export default processIntervalMentions;
