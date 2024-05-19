import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import getWhitelist from './utils/getWhitelist';
import router from './routes';
import { initializeAirstack } from './airstack/airstack';
import fetchRepliesFromCastQueue from './queues/fetchRepliesFromCastQueue';
import fetchLikesFromCastQueue from './queues/fetchReactionsFromCastQueue';

dotenv.config();

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

app.listen(port, () => {
	console.log(`Intelligent Backend || Started on PORT ${port} 🟡`);
});
