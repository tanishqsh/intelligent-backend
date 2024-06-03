/**
 * This file is responsible for creating a job that will fetch the follower count of a user from mimir and store it in the firebase db.
 */

import { Queue, Worker, Job } from 'bullmq';
import connectionOptions from '../../utils/redisConnection';
import { query } from '../mimir';
import { firebase } from '../../firebase/firebase';
import { getUserTopCasts } from '../sql/castsQueries/castsQueries';

let queueName = 'mimir_userTopCasts';

const userTopCastsQueue = new Queue(queueName, { connection: connectionOptions });

const storeTopCastsInFirebase = async (fid: number, rows: any[], durationLabel: string) => {
	const userStatRef = firebase.db.collection('user_stats').doc(fid.toString());
	const batch = firebase.db.batch();
	rows.forEach((row, index) => {
		const topCastRef = userStatRef.collection(`top_casts_${durationLabel}`).doc(index.toString());
		batch.set(topCastRef, row, { merge: true });
	});
	await batch.commit();
	console.log(`📦 [UserTopCastsWorker] Top casts stored in Firebase for FID: ${fid}, Label: ${durationLabel}`);
};

const jobProcess = async (job: Job) => {
	const { fid, duration, label } = job.data;

	console.log(`[UserTopCastsWorker] Initiating fetch process for top casts. FID: ${fid}, Duration: ${duration}`);
	const q = getUserTopCasts(fid, duration);
	const start = Date.now();
	const { rows } = await query(q);
	const queryDuration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`✅ [UserTopCastsWorker] Query duration for FID: ${fid}, Label: ${label} - ${queryDuration}ms`);

	if (!rows.length) {
		console.log(`[UserTopCastsWorker] No top casts found for FID: ${fid}, Label: ${label}`);
		return;
	}

	await storeTopCastsInFirebase(fid, rows, label);
};

const userTopCastsWorker = new Worker(queueName, jobProcess, { connection: connectionOptions });

export default userTopCastsQueue;
