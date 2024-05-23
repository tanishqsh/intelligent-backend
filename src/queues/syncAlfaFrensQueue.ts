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
		console.log('Failed to fetch user info:', userInfo.error);
		return;
	}

	// should later shift to adapter, maybe once they launch the official API
	const aa_address = userInfo.result.data.aa_address;
	const fid = userInfo.result.data.fid;
	const channelAddress = userInfo.result.data.channels.channeladdress;

	if (!channelAddress) {
		console.log('Channel address not found for user:', job.data);
		return;
	}

	console.log('Channel address found for user, processing members now:', channelAddress);

	await addChannelInfoToDB({
		aa_address,
		fid,
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
		const url = `https://www.alfafrens.com/api/trpc/data.getUserByFid?fid=${fid}`;
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
	let hasMoreData = true;
	let channelData = null;

	while (hasMoreData) {
		const response = await axios.get(
			`https://www.alfafrens.com/api/trpc/data.getChannelSubscribersAndStakes?channelAddress=${channelAddress}&first=${first}&skip=${skip}`
		);

		const data = response?.data?.result?.data;
		const members = data?.members;

		console.log('Round:', skip / first + 1);
		console.log('Members Length:', members.length);

		if (members && members.length > 0) {
			allMembers = allMembers.concat(members);
			skip += first;
		} else {
			hasMoreData = false;
		}

		if (!channelData) {
			channelData = data;
		}
	}

	return { channelData, allMembers };
};

export default syncAlfaFrensQueue;
