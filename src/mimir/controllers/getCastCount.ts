import { Request, Response } from 'express';
import Duration from '../sql/castsQueries/Duration';
import { totalCasts_180D, totalCasts_24H, totalCasts_30D, totalCasts_7D } from '../sql/single-charts/totalCasts';
import { query } from '../mimir';

const castCountController = async (req: Request, res: Response) => {
	const fid = Number(req.query.fid);
	const interval = req.query.duration as string;

	if (!fid || isNaN(fid)) {
		return res.status(400).json({ error: 'Invalid fid' });
	}

	if (!interval) {
		return res.status(400).json({ error: 'Invalid duration' });
	}

	// interval will be either 24H, 7D, 30D, 180D, if not, return 400
	if (!['24H', '7D', '30D', '180D'].includes(interval)) {
		return res.status(400).json({ error: 'Invalid duration' });
	}

	let q_interval = Duration.HOURS_24;
	let q = '';

	switch (interval) {
		case '24H':
			q_interval = Duration.HOURS_24;
			q = totalCasts_24H(fid);
			break;
		case '7D':
			q_interval = Duration.DAYS_7;
			q = totalCasts_7D(fid);
			break;
		case '30D':
			q_interval = Duration.DAYS_30;
			q = totalCasts_30D(fid);
			break;
		case '180D':
			q_interval = Duration.DAYS_180;
			q = totalCasts_180D(fid);
			break;
	}

	try {
		const start = Date.now();
		const { castsData } = await convertSQLToChart(q);
		const duration = Date.now() - start;

		const graphData = [
			{
				id: 'Casts',
				data: castsData,
			},
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
};

async function convertSQLToChart(q: string) {
	const { rows } = await query(q);

	const data = rows.map((row: any) => {
		return {
			x: row.interval,
			y: row.casts,
		};
	});

	return {
		castsData: data,
	};
}

export default castCountController;
