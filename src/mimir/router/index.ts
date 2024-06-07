import express from 'express';
import { query } from '../mimir';
import { chart1Query180D, chart1Query24D, chart1Query30D, chart1Query7D } from '../sql/chart1Query';
import { globalUserUpdateQueue } from '../../crons/cronJobs';
import Duration from '../sql/castsQueries/Duration';
import { firebase } from '../../firebase/firebase';
import checkPrivyToken from '../../middleware/checkPrivyToken';
import syncAlfaFrensQueue from '../../queues/syncAlfaFrensQueue';

const router = express.Router();

interface FollowerData {
	x: string;
	y: number;
}

interface LikeData {
	x: string;
	y: number;
}

interface RecastData {
	x: string;
	y: number;
}

router.get('/', async (req, res) => {
	res.json({
		message: 'Mimir answers you 🟡',
	});
});

router.get('/get-chart1', async (req, res) => {
	const fid = Number(req.query.fid);
	const interval = req.query.duration as string;

	if (!fid || isNaN(fid)) {
		return res.status(400).json({ error: 'Invalid fid' });
	}

	if (!interval) {
		return res.status(400).json({ error: 'Invalid duration' });
	}

	// inverval will be either 24H, 7D, 30D, 180D, if not, return 400
	if (!['24H', '7D', '30D', '180D'].includes(interval)) {
		return res.status(400).json({ error: 'Invalid duration' });
	}

	let q_interval = Duration.HOURS_24;

	switch (interval) {
		case '24H':
			q_interval = Duration.HOURS_24;
			break;
		case '7D':
			q_interval = Duration.DAYS_7;
			break;
		case '30D':
			q_interval = Duration.DAYS_30;
			break;
		case '180D':
			q_interval = Duration.DAYS_180;
			break;
	}

	try {
		const start = Date.now();
		const { followersData, likesData, recastsData } = await getChartData(fid, q_interval);
		const duration = Date.now() - start;

		const graphData = [
			{
				id: 'Likes',
				data: likesData,
			},
			{
				id: 'Recasts',
				data: recastsData,
			},
			{
				id: 'Followers',
				data: followersData,
			},
			// Add likes and recasts data here when those functions are implemented
		];

		// log the duration of the query with the message
		const currentTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
		console.log(`API Query duration: ${duration}ms, Current time: ${currentTime} EST`);

		res.json({
			graphData,
			queryDuration: duration,
			message: 'Mimir answers you 🟡',
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

router.get('/update-user', checkPrivyToken, async (req, res) => {
	const fid = req.query.fid as string;

	if (!fid) {
		return res.status(400).json({ error: 'Invalid fid' });
	}

	// const job = await syncAlfaFrensQueue.add(`syncAlfaFrensQueue ${fid}`, { fid });
	await globalUserUpdateQueue(fid, true);

	res.json({
		message: 'User added to the queue',
	});
});

async function getChartData(fid: number, duration: Duration) {
	let q = chart1Query24D(fid);

	console.log('Received Query for ' + duration + ' duration.');

	switch (duration) {
		case Duration.DAYS_7:
			q = chart1Query7D(fid);
			break;
		case Duration.DAYS_30:
			q = chart1Query30D(fid);
			break;
		case Duration.DAYS_180:
			q = chart1Query180D(fid);
			break;
	}

	const { rows } = await query(q);

	/**
	 *  What we are doing here is to loop through the rows and populate the arrays, followersData, likesData, and recastsData to create the graphData object.
	 */
	const followersData: FollowerData[] = [];
	const likesData: LikeData[] = [];
	const recastsData: RecastData[] = [];

	// Loop through the rows and populate the arrays
	for (const row of rows) {
		followersData.push({
			x: row.hour || row.day,
			y: row.new_followers,
		});
		likesData.push({
			x: row.hour || row.day,
			y: row.likes,
		});
		recastsData.push({
			x: row.hour || row.day,
			y: row.recasts,
		});
	}

	return { followersData, likesData, recastsData };
}
export default router;
