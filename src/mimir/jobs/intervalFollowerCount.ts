/**
 * This file is responsible for creating a job that will fetch the follower count of a user from mimir and store it in the firebase db.
 */

import { Queue, Worker, Job } from 'bullmq';
import connectionOptions from '../../utils/redisConnection';
import { query } from '../mimir';
import { getIntervalFollowerCount } from '../sql/followersQueries';
import { firebase } from '../../firebase/firebase';

let queueName = 'mimir_intervalFollowerCount';

const intervalFollowerCountQueue = new Queue(queueName, { connection: connectionOptions });

const jobProcess = async (job: Job) => {
	console.log('Processing Job: Interval Follower-Count Worker for FID:', job.data);
	const fid = job.data;
	const q = getIntervalFollowerCount(fid);
	const start = Date.now();
	const { rows } = await query(q);
	const duration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`✅ Duration [IntervalFollowerCountWorker-${fid}]: ${duration}ms`);

	// add follower count to firebase
	try {
		const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());

		// add the new table here
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
		console.error('Error adding follower count to Firebase:', error);
	}
};

const intervalFollowerCountWorker = new Worker(queueName, jobProcess, { connection: connectionOptions });

export default intervalFollowerCountQueue;
