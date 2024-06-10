import { Queue } from 'bullmq';
import { firebase } from '../../firebase/firebase';
import syncAlfaFrensQueue from '../../queues/syncAlfaFrensQueue';
import Duration from '../sql/castsQueries/Duration';
import followerCountQueue from './followerCount';
import intervalAggregationsQueue, { intervalJobType } from './intervalAggregations/intervalAggregations';
import intervalListsQueue, { intervalListsJobType } from './intervalLists/intervalLists';

/**
 * Add a user to the queue
 * @param fid
 */
export const globalUserUpdateQueue = async (fid: string, isSingle: boolean = false) => {
	const now = new Date();

	const lastSynchedData = await getLastSynched(fid);

	const syncInterval = 60 * 60 * 1000;
	if (lastSynchedData.lastSynched && now.getTime() - lastSynchedData.lastSynched.getTime() < syncInterval) {
		const intervalText = '60 minutes';
		console.log(`Skipping ${fid} as stats were synched less than ${intervalText} ago.`);
		return;
	}

	const options: Intl.DateTimeFormatOptions = { timeZone: 'America/New_York', timeZoneName: 'short' };
	console.log(`=== Starting global user update for ${fid} at ${now.toLocaleString('en-US', options)} ===`);

	const jobs = [
		{ queue: syncAlfaFrensQueue, name: `syncAlfaFrensQueue: ${fid}`, data: fid, log: `🚄 ALFAFRENS SYNC QUEUE – FID: ${fid}` },
		{ queue: followerCountQueue, name: `syncFollowerCount: ${fid}`, data: fid, log: `🚄 FOLLOWER COUNT SYNC QUEUE – FID: ${fid}` },
		{
			queue: intervalListsQueue,
			name: `userTopCast24h_${fid}`,
			data: { fid, duration: Duration.HOURS_24, label: '24h', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: intervalListsQueue,
			name: `userTopCast7d_${fid}`,
			data: { fid, duration: Duration.DAYS_7, label: '7d', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: intervalListsQueue,
			name: `userTopCast30d_${fid}`,
			data: { fid, duration: Duration.DAYS_30, label: '30d', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: intervalListsQueue,
			name: `userTopCast180d_${fid}`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.topCasts },
			log: `🚄 USER TOP CASTS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers_${fid}_24h`,
			data: { fid, duration: Duration.HOURS_24, label: '24h', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers_${fid}_7d`,
			data: { fid, duration: Duration.DAYS_7, label: '7d', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers_${fid}_30d`,
			data: { fid, duration: Duration.DAYS_30, label: '30d', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactFollowers_${fid}_180d`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.impactFollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalListsQueue,
			name: `impactUnfollowers_${fid}_180d`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.impactUnfollowers },
			log: `🚄 IMPACT FOLLOWERS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		// add mentions interval list job
		{
			queue: intervalListsQueue,
			name: `topMentions_${fid}_24h`,
			data: { fid, duration: Duration.HOURS_24, label: '24h', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 24h`,
		},
		{
			queue: intervalListsQueue,
			name: `topMentions_${fid}_7d`,
			data: { fid, duration: Duration.DAYS_7, label: '7d', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 7d`,
		},
		{
			queue: intervalListsQueue,
			name: `topMentions_${fid}_30d`,
			data: { fid, duration: Duration.DAYS_30, label: '30d', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 30d`,
		},
		{
			queue: intervalListsQueue,
			name: `topMentions_${fid}_180d`,
			data: { fid, duration: Duration.DAYS_180, label: '180d', type: intervalListsJobType.topMentions },
			log: `🚄 TOP MENTIONS SYNC QUEUE – FID: ${fid} - 180d`,
		},
		{
			queue: intervalAggregationsQueue,
			name: `intervalFollowerCount_${fid}`,
			data: { fid, type: intervalJobType.followerCount },
			log: `🚄 INTERVAL FOLLOWER COUNT SYNC QUEUE – FID: ${fid}`,
		},
		{
			queue: intervalAggregationsQueue,
			name: `intervalAggregations_${fid}`,
			data: { fid, type: intervalJobType.reactions },
			log: `🚄 INTERVAL AGGREGATIONS SYNC QUEUE – FID: ${fid} - TYPE: reactions`,
		},
		{
			queue: intervalAggregationsQueue,
			name: `intervalAggregations_${fid}`,
			data: { fid, type: intervalJobType.mentions },
			log: `🚄 INTERVAL AGGREGATIONS SYNC QUEUE – FID: ${fid} - TYPE: mentions`,
		},
	];

	const results = await Promise.all(
		jobs.map(async (job) => {
			try {
				const existingJob = await job.queue.getJob(job.name);
				if (!existingJob) {
					await job.queue.add(job.name, job.data, { removeOnComplete: true, removeOnFail: true });
					console.log(`${job.log} - Successfully added`);
				} else {
					console.log(`${job.log} - Job already exists`);
				}
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
