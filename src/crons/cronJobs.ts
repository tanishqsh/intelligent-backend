import { CronJob } from 'cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import { globalUserUpdateQueue } from '../mimir/jobs/globalUserUpdateQueue';

const LOCK_KEY = 'cronJobLock';
const LOCK_EXPIRY = 600000; //

console.log('Cron jobs are ready 🟡');

// This cron job runs every 30 minutes
const job = new CronJob('0 */30 * * * *', async () => {
	const now = new Date();
	console.log('Cron job executed: ', now.toISOString());
	const users = await fetchUsersFromDB();
	users.forEach((fid) => {
		globalUserUpdateQueue(fid);
	});
});

job.start();
