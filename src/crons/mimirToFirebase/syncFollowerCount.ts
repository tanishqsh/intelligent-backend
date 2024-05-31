import { CronJob } from 'cron';
import fetchUsersFromDB from '../../db/fetchUsersFromDB';
import followerCountQueue from '../../mimir/jobs/followerCount';

console.log('Sync Follower Count Is Started 🔄');

// this cron job will run every 30 minutes
const job = new CronJob('0 */30 * * * *', async () => {
	const now = new Date();
	console.log('Sync Follower Count Executed: ', now.toISOString());

	const users = await fetchUsersFromDB();

	users.forEach((fid) => {
		addToQueue(fid);
	});
});

job.start();

const addToQueue = async (fid: string) => {
	console.log(`Sync Follower Count Job for ${fid} added to queue ✅ by cron`);
	const job = await followerCountQueue.add(`syncFollowerCount: ${fid}`, fid);
};
