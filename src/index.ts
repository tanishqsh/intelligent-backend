import dotenv from 'dotenv';

// configure dotenv first and foremost
dotenv.config();

import express, { Request, Response } from 'express';
import getWhitelist from './utils/getWhitelist';
import router from './routes';
import alfafrensRouter from './routes/alfafrens';
import userRouter from './routes/users';
import degenRouter from './routes/degen';
import mimirRouter from './mimir/router/';
import { initializeAirstack } from './airstack/airstack';

// importing worker queues – Do not remove these imports, they are necessary for the queues to work
import fetchRepliesFromCastQueue from './queues/fetchRepliesFromCastQueue';
import fetchLikesFromCastQueue from './queues/fetchReactionsFromCastQueue';
import syncAlfaFrensQueue from './queues/syncAlfaFrensQueue';

// mimir
import { initializeMimir, query } from './mimir/mimir';
import { getFollowersCount } from './mimir/sql/followersQueries';

initializeAirstack();
initializeMimir();

const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use CORS middleware
app.use(cors());

/** Log that firebase.db is ready */
console.log('Firebase DB is ready 🟡');

app.get('/', async (req: Request, res: Response) => {
	let whitelist = await getWhitelist();
	res.json({
		message: '🟡',
		whitelist,
	});
});

app.get('/mimir', async (req: Request, res: Response) => {
	const fid = 2341;
	const get_followers_by_fid_query = getFollowersCount(fid);

	const start = Date.now();
	const { rows } = await query(get_followers_by_fid_query);
	const duration = Date.now() - start;

	res.json({
		data: rows,
		queryDuration: `${duration}ms`,
		lastSynched: new Date().toISOString(),
		message: '🟡',
	});
});
app.use('/api', router);
app.use('/api/alfafrens', alfafrensRouter);
app.use('/api/user', userRouter);
app.use('/api/mimir', mimirRouter);

/**
 * Get allowance for a degen
 */
app.use('/api/degen', degenRouter);

app.listen(port, () => {
	console.log(`Intelligent Backend || Started on PORT ${port} 🟡`);
});
