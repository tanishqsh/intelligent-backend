/**
 * This file is responsible for creating a job that will fetch the follower count of a user from mimir and store it in the firebase db.
 */

import { Queue, Worker, Job } from 'bullmq';
import connectionOptions from '../../utils/redisConnection';
import { query } from '../mimir';
import { getFollowersCount } from '../sql/followersQueries';
import { firebase } from '../../firebase/firebase';

let queueName = 'mimir_followerCount';

const followerCountQueue = new Queue(queueName, { connection: connectionOptions });

const jobProcess = async (job: Job) => {
	console.log('Processing Job: Follower-Count Worker for FID:', job.data);
	const fid = job.data;
	const get_followers_by_fid_query = getFollowersCount(fid);
	const start = Date.now();
	const { rows } = await query(get_followers_by_fid_query);
	const duration = Date.now() - start;

	// print query duration for logs along with identifier so we can easily search for it
	console.log(`Duration [FollowerCountWorker-${fid}]: ${duration}ms`);

	// create an object
	const userStat = {
		fid,
		followers: rows[0].followers_count,
		lastSynched: new Date().toISOString(),
	};

	console.log('UserStat:', userStat);

	// add follower count to firebase
	try {
		await addFollowerCountToFirebase(userStat);
		console.log('Follower count added to Firebase successfully');
	} catch (error) {
		console.error('Error adding follower count to Firebase:', error);
	}
};

const addFollowerCountToFirebase = async (userStat: any) => {
	const userStatRef = firebase.db.collection('user_stats').doc(userStat.fid.toString());
	await userStatRef.set(userStat, { merge: true });
};

const followerCountWorker = new Worker(queueName, jobProcess, { connection: connectionOptions });

export default followerCountQueue;
