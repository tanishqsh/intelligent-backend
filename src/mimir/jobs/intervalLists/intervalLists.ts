import { Job, Queue, Worker } from 'bullmq';
import connectionOptions from '../../../utils/redisConnection';
import processImpactFollowers from './processImpactFollowers';
import processTopCasts from './processTopCasts';

let queueName = 'mimir_intervalListsQueue';

export enum intervalListsJobType {
	impactFollowers = 'impactFollowers',
	topCasts = 'topCasts',
}

const intervalListsQueue = new Queue(queueName, { connection: connectionOptions });

const jobProcess = async (job: Job) => {
	const { fid, duration, label, type } = job.data;

	switch (type) {
		case intervalListsJobType.impactFollowers:
			await processImpactFollowers(fid, duration, label);
			break;
		case intervalListsJobType.topCasts:
			await processTopCasts(fid, duration, label);
			break;
		default:
			console.log(`[IntervalListsWorker] Unknown job type: ${type}`);
			break;
	}
};

const intervalListsWorker = new Worker(queueName, jobProcess, { connection: connectionOptions });

export default intervalListsQueue;
