import dotenv from 'dotenv';

// configure dotenv first and foremost
dotenv.config();

import express, { Request, Response } from 'express';
import getWhitelist from './utils/getWhitelist';
import router from './routes';
import alfafrensRouter from './routes/alfafrens';
import userRouter from './routes/users';
import { initializeAirstack } from './airstack/airstack';

// importing worker queues
import fetchRepliesFromCastQueue from './queues/fetchRepliesFromCastQueue';
import fetchLikesFromCastQueue from './queues/fetchReactionsFromCastQueue';

initializeAirstack();

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

app.use('/api', router);
app.use('/api/alfafrens', alfafrensRouter);
app.use('/api/user', userRouter);

app.listen(port, () => {
	console.log(`Intelligent Backend || Started on PORT ${port} 🟡`);
});
