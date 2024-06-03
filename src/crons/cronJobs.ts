import { CronJob } from 'cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import syncAlfaFrensQueue from '../queues/syncAlfaFrensQueue';
import followerCountQueue from '../mimir/jobs/followerCount';
import userTopCastsQueue from '../mimir/jobs/userTopCasts';
import Duration from '../mimir/sql/castsQueries/Duration';
import intervalFollowerCountQueue from '../mimir/jobs/intervalFollowerCount';
import intervalAggregationsQueue, { intervalJobType } from '../mimir/jobs/intervalAggregations/intervalAggregations';

// Log message indicating that the cron has been loaded
console.log('Cron jobs are ready 🟡');

// This cron job will run every hour
const job = new CronJob('0 0 * * * *', async () => {
	const now = new Date();
	console.log('Cron job executed: ', now.toISOString());

	// Fetch all users from the database
	const users = await fetchUsersFromDB();

	// add each user to the queue
	users.forEach((fid) => {
		globalUserUpdateQueue(fid);
	});
});

// Start the cron job
job.start();

/**
 * Add a user to the queue
 * @param fid
 */
export const globalUserUpdateQueue = async (fid: string) => {
	const now = new Date();

	const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', timeZoneName: 'short' };
	console.log(`=== Starting global user update for ${fid} at ${now.toLocaleString('en-US', options)} ===`);

	const jobs = [
		{ queue: syncAlfaFrensQueue, name: `syncAlfaFrensQueue: ${fid}`, data: fid, log: `🚄 ALFAFRENS SYNC QUEUE – FID: ${fid}` },
		{ queue: followerCountQueue, name: `syncFollowerCount: ${fid}`, data: fid, log: `🚄 FOLLOWER COUNT SYNC QUEUE – FID: ${fid}` },
		{
			queue: userTopCastsQueue,
			name: `syncUserStats: ${fid}`,
			data: { fid, duration: Duration.HOURS_24, label: '24h' },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: userTopCastsQueue,
			name: `syncUserStats: ${fid}`,
			data: { fid, duration: Duration.DAYS_7, label: '7d' },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: userTopCastsQueue,
			name: `syncUserStats: ${fid}`,
			data: { fid, duration: Duration.DAYS_30, label: '30d' },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: userTopCastsQueue,
			name: `syncUserStats: ${fid}`,
			data: { fid, duration: Duration.DAYS_180, label: '180d' },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalFollowerCountQueue,
			name: `intervalFollowerCount: ${fid}`,
			data: fid,
			log: `🚄 INTERVAL FOLLOWER COUNT SYNC QUEUE – FID: ${fid}`,
		},
		{
			queue: intervalAggregationsQueue,
			name: `intervalAggregations: ${fid}`,
			data: { fid, type: intervalJobType.reactions },
			log: `🚄 INTERVAL AGGREGATIONS SYNC QUEUE – FID: ${fid} - TYPE: reactions`,
		},
		{
			queue: intervalAggregationsQueue,
			name: `intervalAggregations: ${fid}`,
			data: { fid, type: intervalJobType.mentions },
			log: `🚄 INTERVAL AGGREGATIONS SYNC QUEUE – FID: ${fid} - TYPE: mentions`,
		},
	];

	const results = await Promise.all(
		jobs.map(async (job) => {
			try {
				await job.queue.add(job.name, job.data);
				console.log(`${job.log} - Successfully added`);
				return { job: job.name, status: 'success' };
			} catch (error) {
				console.error(`${job.log} - Failed to add`, error);
				return { job: job.name, status: 'failure', error };
			}
		})
	);

	// Optionally, you can process the results array to take further actions if needed
	console.log('Job addition results:', results);
};
