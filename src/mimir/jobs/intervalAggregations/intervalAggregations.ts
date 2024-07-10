import { Queue, Worker, Job } from 'bullmq';
import connectionOptions from '../../../utils/redisConnection';

import processIntervalReactions from './processIntervalReactions';
import processIntervalMentions from './processIntervalMentions';
import processIntervalFollowerCount from './processIntervalFollowerCount';
import processIntervalTotalCasts from './processIntervalTotalCasts';

export enum intervalJobType {
	reactions = 'reactions',
	mentions = 'mentions',
	followerCount = 'followerCount',
	totalCasts = 'totalCasts',
}

let queueName = 'mimir_intervalAggregations';

// this is a general worker that works on different types of aggregations, specifically intervals
const intervalAggregationsQueue = new Queue(queueName, { connection: connectionOptions });

const process = async (job: Job) => {
	const { fid, type } = job.data;

	switch (type) {
		case intervalJobType.reactions:
			await processIntervalReactions(fid);
			break;

		case intervalJobType.mentions:
			await processIntervalMentions(fid);
			break;

		case intervalJobType.followerCount:
			await processIntervalFollowerCount(fid);
			break;
		case intervalJobType.totalCasts:
			await processIntervalTotalCasts(fid);
			break;
		default:
			console.error('Invalid job type');
	}
};

const intervalAggregationsWorker = new Worker(queueName, process, { connection: connectionOptions });

export default intervalAggregationsQueue;

intervalAggregationsWorker.on('completed', (job) => {
	console.log(`Job ${job.id} completed successfully`);
});

intervalAggregationsWorker.on('failed', (job, err) => {
	console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
