import { CronJob } from 'cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import redlock from '../utils/redlock';
import { globalUserUpdateQueue } from '../mimir/jobs/globalUserUpdateQueue';
import Redlock, { ExecutionError } from 'redlock';

const LOCK_KEY = 'cronJobLock';
const LOCK_EXPIRY = 600000; //

console.log('Cron jobs are ready 🟡');

// This cron job runs every 30 minutes
const job = new CronJob('0 */30 * * * *', async () => {
	const now = new Date();
	console.log('Cron job executed: ', now.toISOString());
	try {
		const lock = await redlock.acquire([LOCK_KEY], LOCK_EXPIRY);
		console.log('Lock acquired, running cron job');

		const users = await fetchUsersFromDB();
		users.forEach((fid) => {
			globalUserUpdateQueue(fid);
		});

		// Release the lock after the job is done
		await lock.release();
		console.log('Lock released, job done');
	} catch (err) {
		if (err instanceof ExecutionError) {
			console.log('Failed to acquire lock, another instance is running the job');
		} else {
			console.error('Error occurred in cron job:', err);
		}
	}
});

job.start();
