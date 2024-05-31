import { CronJob } from 'cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import syncAlfaFrensQueue from '../queues/syncAlfaFrensQueue';

import './mimirToFirebase/syncFollowerCount';

// Log message indicating that the cron has been loaded
console.log('Cron jobs are ready 🟡');

// Define the task to run every 6 hours
const job = new CronJob('0 */6 * * *', async () => {
	const now = new Date();
	console.log('Cron job executed: ', now.toISOString());

	// Add your task logic here
	const users = await fetchUsersFromDB();

	// add each user to the queue
	users.forEach((fid) => {
		addToQueue(fid);
	});
});

// Start the cron job
job.start();

/**
 * Add a user to the queue
 * @param fid
 */
const addToQueue = async (fid: string) => {
	const job = await syncAlfaFrensQueue.add(`syncAlfaFrensQueue: ${fid}`, fid);
	console.log(`AlfaFrens Sync Job for ${fid} added to queue ✅ by cron`);
};
