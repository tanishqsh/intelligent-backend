import { Queue, Worker, Job } from 'bullmq';
import connectionOptions from '../utils/redisConnection';
import axios from 'axios';
import { addChannelInfoToDB, addChannelMembersToDB } from '../db/ecosystem/alfafrens/addChannelInfoToDB';

let queueName = 'syncAlfaFrensQueue';

// declaring a queue
const syncAlfaFrensQueue = new Queue(queueName, { connection: connectionOptions });

// declaring the job process
const processJob = async (job: Job) => {
	let userInfo: any;

	console.log('[Sync Alfa Frens Worker], Processing Job for FID:', job.data);

	if (!job.data) {
		console.log('Invalid job data');
		return;
	}

	userInfo = await fetchUserProfile(job.data);

	if (!userInfo || userInfo.error) {
		console.log('Failed to fetch user info (Prolly doesnt exist):', userInfo.error);
		return;
	}

	// should later shift to adapter, maybe once they launch the official API
	const aFUserAddress = userInfo.userAddress;
	const fid = userInfo.fid;
	const handle = userInfo.handle;
	const channelAddress = userInfo.channeladdress;

	// this is where we will find the fid in the user profiles collection, if it doesn't exists, fetch from airstack, and save it in the user profiles

	if (!channelAddress) {
		console.log('Channel address not found for user:', job.data);
		return;
	}

	console.log('Channel address found for user, processing members now:', channelAddress);

	await addChannelInfoToDB({
		aFUserAddress,
		fid,
		handle,
		channelAddress,
	});

	const { channelData, allMembers } = await fetchAllChannelDataAndMembers(channelAddress);

	await addChannelMembersToDB(fid, channelData, allMembers);

	console.log('Channel members info added to the database successfully');
};

// declaring the worker
const syncAlfaFrensWorker = new Worker(queueName, processJob, {
	connection: connectionOptions,
});

/** Functions */

async function fetchUserProfile(fid: string) {
	try {
		const url = `https://alfafrens.com/api/v0/getUserByFid?fid=${fid}`;
		const response = await axios.get(url);
		return response.data;
	} catch (error) {
		return { error: `Failed to fetch user info for fid ${fid}` };
	}
}

const fetchAllChannelDataAndMembers = async (channelAddress: string) => {
	let allMembers: any[] = [];
	let skip = 0;
	const first = 200;
	let channelData = null;
	let hasMore = true;

	while (hasMore) {
		const response = await axios.get(
			`https://alfafrens.com/api/v0/getChannelSubscribersAndStakes?channelAddress=${channelAddress}&first=${first}&skip=${skip}`
		);

		const data = response?.data;
		const members = data?.members;
		hasMore = data?.hasMore;

		console.log('Round:', skip / first + 1);
		console.log('Members Length:', members.length);

		if (members && members.length > 0) {
			allMembers = allMembers.concat(members);
			skip += first;
		}

		if (!channelData) {
			channelData = data;
		}
	}

	return { channelData, allMembers };
};

// Example usage:
// fetchAllChannelDataAndMembers('0xa0d5ecba4772ef45f5205b84cf02816bf3a88ec5').then(data => console.log(data));

export default syncAlfaFrensQueue;
