import axios from 'axios';

const express = require('express');

const router = express.Router();

router.get('/', (req: any, res: any) => {
	res.json({
		message: 'AlfaFrens API route 🟡',
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

	res.json({
		// userData,
		channelData,
		channelAddress: channelAddress,
		success: true,
	});
});

const getUserByFid = async (fid: string) => {
	const response = await axios.get(`https://www.alfafrens.com/api/trpc/data.getUserByFid?fid=${fid}`);
	return response.data;
};

// export the router as alfafrensRouter

export default router;
