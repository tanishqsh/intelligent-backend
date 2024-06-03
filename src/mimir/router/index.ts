import express from 'express';
import { query } from '../mimir';
import { chart1Query } from '../sql/chart1Query';
import { globalUserUpdateQueue } from '../../crons/cronJobs';

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

	if (isNaN(fid)) {
		return res.status(400).json({ error: 'Invalid fid' });
	}

	try {
		const start = Date.now();
		const { followersData, likesData, recastsData } = await getChartData(fid);
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

router.get('/update-user', async (req, res) => {
	const fid = req.query.fid as string;

	if (!fid) {
		return res.status(400).json({ error: 'Invalid fid' });
	}

	await globalUserUpdateQueue(fid);

	res.json({
		message: 'User added to the queue',
	});
});

async function getChartData(fid: number) {
	const q = chart1Query(fid);
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
			x: row.hour,
			y: row.new_followers,
		});
		likesData.push({
			x: row.hour,
			y: row.likes,
		});
		recastsData.push({
			x: row.hour,
			y: row.recasts,
		});
	}

	return { followersData, likesData, recastsData };
}
export default router;
