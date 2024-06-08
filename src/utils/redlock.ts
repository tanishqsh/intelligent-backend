// redlock.ts
import Redlock from 'redlock';
import { redis } from './redisConnection';

// Create a Redlock instance
const redlock = new Redlock([redis], {
	driftFactor: 0.01, // Time in ms
	retryCount: 10,
	retryDelay: 200, // Time in ms
	retryJitter: 200, // Time in ms
});

redlock.on('clientError', (err) => {
	console.error('A Redis [Redlock] error has occurred:', err);
});

export default redlock;
