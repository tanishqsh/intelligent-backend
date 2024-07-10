import { firebase } from '../../../firebase/firebase';
import { query } from '../../mimir';
import { getIntervalCastCount } from '../../sql/castsQueries/castsQueries';

const processIntervalTotalCasts = async (fid: number) => {
	console.log('Processing Job: Interval Total Cast Count for FID:', fid);
	const q = getIntervalCastCount(fid);
	const start = Date.now();
	const { rows } = await query(q);
	const duration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`✅ Duration [IntervalTotalCastCountWorker-${fid}]: ${duration}ms`);

	// add reactions interval count to firebase
	try {
		const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());

		await userStatRef.set(
			{
				total_casts_stat: {
					casts_24h: rows[0].casts_24h,
					casts_prev_24h: rows[0].casts_prev_24h,
					casts_7d: rows[0].casts_7d,
					casts_prev_7d: rows[0].casts_prev_7d,
					casts_30d: rows[0].casts_30d,
					casts_prev_30d: rows[0].casts_prev_30d,
					casts_180d: rows[0].casts_180d,
					casts_prev_180d: rows[0].casts_prev_180d,
				},
			},
			{
				merge: true,
			}
		);
	} catch (error) {
		console.error('Error adding total cast count interval to Firebase:', error);
	}
};

export default processIntervalTotalCasts;
