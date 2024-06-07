import { CronJob } from 'cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import syncAlfaFrensQueue from '../queues/syncAlfaFrensQueue';
import followerCountQueue from '../mimir/jobs/followerCount';
import userTopCastsQueue from '../mimir/jobs/userTopCasts';
import Duration from '../mimir/sql/castsQueries/Duration';
import intervalAggregationsQueue, { intervalJobType } from '../mimir/jobs/intervalAggregations/intervalAggregations';
import intervalListsQueue, { intervalListsJobType } from '../mimir/jobs/intervalLists/intervalLists';
import { firebase } from '../firebase/firebase';

// Log message indicating that the cron has been loaded
console.log('Cron jobs are ready 🟡');

// This cron job will run every 10 minutes
const job = new CronJob('0 */10 * * * *', async () => {
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

	const lastSynchedData = await getLastSynched(fid);

	// If lastSynched exists and is less than 30 minutes ago, skip adding to queue
	if (lastSynchedData.lastSynched && now.getTime() - lastSynchedData.lastSynched.getTime() < 30 * 60 * 1000) {
		console.log(`Skipping ${fid} as it was synched less than 30 minutes ago.`);
		return;
	}

	const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', timeZoneName: 'short' };
	console.log(`=== Starting global user update for ${fid} at ${now.toLocaleString('en-US', options)} ===`);

	const jobs = [
		{ queue: syncAlfaFrensQueue, name: `syncAlfaFrensQueue: ${fid}`, data: fid, log: `🚄 ALFAFRENS SYNC QUEUE – FID: ${fid}` },
		{ queue: followerCountQueue, name: `syncFollowerCount: ${fid}`, data: fid, log: `🚄 FOLLOWER COUNT SYNC QUEUE – FID: ${fid}` },
		{
			queue: intervalListsQueue,
			name: `userTopCast24h: ${fid}`,
			data: { fid, duration: Duration.HOURS_24, label: '24h', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: intervalListsQueue,
			name: `userTopCast7d: ${fid}`,
			data: { fid, duration: Duration.DAYS_7, label: '7d', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: intervalListsQueue,
			name: `userTopCast30d: ${fid}`,
			data: { fid, duration: Duration.DAYS_30, label: '30d', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: intervalListsQueue,
			name: `userTopCast180d: ${fid}`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers: ${fid} - 24h`,
			data: { fid, duration: Duration.HOURS_24, label: '24h', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers: ${fid} - 7d`,
			data: { fid, duration: Duration.DAYS_7, label: '7d', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers: ${fid} - 30d`,
			data: { fid, duration: Duration.DAYS_30, label: '30d', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers: ${fid} - 180d`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactUnfollowers: ${fid} - 180d`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.impactUnfollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		// add mentions interval list job
		{
			queue: intervalListsQueue,
			name: `topMentions: ${fid} - 24h`,
			data: { fid, duration: Duration.HOURS_24, label: '24h', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: intervalListsQueue,
			name: `topMentions: ${fid} - 7d`,
			data: { fid, duration: Duration.DAYS_7, label: '7d', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: intervalListsQueue,
			name: `topMentions: ${fid} - 30d`,
			data: { fid, duration: Duration.DAYS_30, label: '30d', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: intervalListsQueue,
			name: `topMentions: ${fid} - 180d`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalAggregationsQueue,
			name: `intervalFollowerCount: ${fid}`,
			data: { fid, type: intervalJobType.followerCount },
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

const getLastSynched = async (fid: string) => {
	// use firebase to get the value of user_stats (collection) > fid (document) > lastSynched

	// convert fid to string and check if it is a non-empty string

	let fidString = fid.toString();

	if (!fidString || typeof fidString !== 'string' || fidString.trim() === '') {
		console.log('Received FID in getLastSynched', fid);
		throw new Error('Invalid fid. Fid must be a non-empty string.');
	}
	// check if the document exists in collection user_stats, if not return date 0

	const doc = await firebase.db.collection('user_stats').doc(fidString).get();
	const data = doc.data();

	if (!data || !data.lastSynched) {
		return { lastSynched: new Date(0), message: 'No previous sync found' };
	}

	// Convert lastSynched to a Date object
	data.lastSynched = new Date(data.lastSynched);

	return data;
};
