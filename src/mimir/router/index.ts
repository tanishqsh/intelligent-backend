import express from 'express';
import { getFollowersPerHourLast24Hours } from '../sql/followersQueries';
import { query } from '../mimir';
import { getLikesPerHourLast24Hours } from '../sql/likesQueries';
import { getRecastsPerHourLast24Hours } from '../sql/recastsQueries';
import { chart1Query } from '../sql/chart1Query';

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
				id: 'Followers Gained',
				data: followersData,
			},
			// Add likes and recasts data here when those functions are implemented
		];

		console.log('graphData', graphData);

		res.json({
			graphData,
			queryDuration: duration,
			message: 'Mimir answers you 🟡',
		});
	} catch (error) {
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

async function getChartData(fid: number) {
	const q = chart1Query(fid);
	const { rows } = await query(q);
	// rows contains 4 columns:
	// hour, new_followers, likes, recasts, we want each of those to be in their own array for the graph

	// Initialize the arrays
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
