import { Job, Queue, Worker } from 'bullmq';
import connectionOptions from '../../../utils/redisConnection';
import processImpactFollowers from './processImpactFollowers';
import processTopCasts from './processTopCasts';
import processImpactUnfollowers from './processImpactUnfollowers';
import processTopMentions from './processTopMentions';

let queueName = 'mimir_intervalListsQueue';

export enum intervalListsJobType {
	impactFollowers = 'impactFollowers',
	impactUnfollowers = 'impactUnfollowers',
	topCasts = 'topCasts',
	topMentions = 'topMentions',
}

const intervalListsQueue = new Queue(queueName, { connection: connectionOptions });

const jobProcess = async (job: Job) => {
	const { fid, duration, label, type } = job.data;

	switch (type) {
		case intervalListsJobType.impactFollowers:
			await processImpactFollowers(fid, duration, label);
			break;
		case intervalListsJobType.impactUnfollowers:
			await processImpactUnfollowers(fid, duration, label);
			break;
		case intervalListsJobType.topCasts:
			await processTopCasts(fid, duration, label);
			break;
		case intervalListsJobType.topMentions:
			await processTopMentions(fid, duration, label);
			break;
		default:
			console.log(`[IntervalListsWorker] Unknown job type: ${type}`);
			break;
	}
};

const intervalListsWorker = new Worker(queueName, jobProcess, { connection: connectionOptions });

export default intervalListsQueue;

intervalListsWorker.on('completed', (job) => {
	console.log(`Job ${job.id} completed successfully`);
});

intervalListsWorker.on('failed', (job, err) => {
	console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
