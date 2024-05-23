import axios from 'axios';
import syncAlfaFrensQueue from '../queues/syncAlfaFrensQueue';

const express = require('express');

const router = express.Router();

router.get('/', (req: any, res: any) => {
	res.json({
		message: 'AlfaFrens API route 🟡',
	});
});

router.get('/jobTestAlfa', async (req: any, res: any) => {
	let fid = req.query.fid;

	// convert to string
	fid = fid.toString();

	if (!fid || typeof fid !== 'string') {
		return res.status(400).json({
			message: 'Please provide a valid fid',
		});
	}

	console.log('Adding job to the queue:', fid);

	// add job to the queue
	const job = await syncAlfaFrensQueue.add(`syncAlfaFrensQueue: ${fid}`, fid);

	if (job) {
		console.log('Job added to queue ✅');
	} else {
		console.log('Failed to add job to queue ❌');
	}

	res.json({
		message: 'Job added to the queue',
		success: true,
		job: job,
	});
});

router.get('/getUserStats', async (req: any, res: any) => {
	const fid = req.query.fid;

	if (!fid || typeof fid !== 'string') {
		return res.status(400).json({
			message: 'Please provide a valid fid',
		});
	}

	const userData = await getUserByFid(fid);

	if (!userData) {
		return res.status(400).json({
			message: 'User not found',
			success: false,
		});
	}

	const channelAddress = userData?.result?.data?.channels?.channeladdress || null;

	if (!channelAddress) {
		return res.status(400).json({
			message: 'Channel address not found',
			success: false,
		});
	}

	// https://www.alfafrens.com/api/trpc/data.getChannelSubscribersAndStakes?channelAddress=0xa0d5ecba4772ef45f5205b84cf02816bf3a88ec5&first=200

	const response = await axios.get(`https://www.alfafrens.com/api/trpc/data.getChannelSubscribersAndStakes?channelAddress=${channelAddress}&first=200`);

	const channelData = response?.data?.result?.data;

	if (!channelData) {
		return res.status(400).json({
			message: 'Channel data not found',
			success: false,
		});
	}

	try {
		const { channelData, allMembers } = await fetchAllChannelDataAndMembers(channelAddress);
		res.json({
			channelData: channelData,
			members: allMembers,
			channelAddress: channelAddress,
			success: true,
		});
	} catch (error) {
		return res.status(500).json({
			message: 'Failed to fetch channel data',
			success: false,
		});
	}
});

const getUserByFid = async (fid: string) => {
	const response = await axios.get(`https://www.alfafrens.com/api/trpc/data.getUserByFid?fid=${fid}`);
	return response.data;
};

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

export default router;
