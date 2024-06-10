import { CronJob } from 'cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import { globalUserUpdateQueue } from '../mimir/jobs/globalUserUpdateQueue';

// console.log('Cron jobs are ready 🟡');

// This cron job will run every 30 minutes
// const job = new CronJob('0 */30 * * * *', async () => {
// 	const now = new Date();
// 	console.log('Cron job executed: ', now.toISOString());
// 	// const users = await fetchUsersFromDB();
// 	// users.forEach((fid) => {
// 	// 	globalUserUpdateQueue(fid);
// 	// });
// });

// job.start();
