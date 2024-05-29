import { Queue, Worker } from 'bullmq';
import connectionOptions from '../utils/redisConnection';
import { fetchQueryWithPagination } from '@airstack/node';
import { getRepliesByUrlQuery } from '../utils/airstack-query-constructors/getRepliesByUrlQuery';
import { addRepliesToDB } from '../db/addRepliesToDB';

let queueName = 'fetchRepliesFromCastQueue';

const fetchRepliesFromCastQueue = new Queue(queueName, { connection: connectionOptions });

// create a worker for the queue – what process should be done when a job is received
const fetchRepliesFromCastWorker = new Worker(
	queueName,
	async (job) => {
		console.log('[Replies Worker], Processing Job:', job.data);

		const replies = await fetchReplies(job.data);

		await addRepliesToDB(replies);

		return job.data;
	},
	{ connection: connectionOptions }
);

async function fetchReplies(castURL: string) {
	let replies: any[] = [];
	let hasNextPage = false;
	let nextPageCursor = '';
	let query;
	let replyData;

	console.log('==========Fetching replies for: ', castURL);

	do {
		// reply count
		console.log('Reply count: ', replies.length);
		query = getRepliesByUrlQuery(castURL, nextPageCursor);
		replyData = await fetchQueryWithPagination(query);

		if (replyData.data.FarcasterReplies.Reply) {
			replies = [...replies, ...replyData.data.FarcasterReplies.Reply];
		}

		if (replyData.data.FarcasterReplies.pageInfo.hasNextPage) {
			hasNextPage = true;
			nextPageCursor = replyData.data.FarcasterReplies.pageInfo.nextCursor;
		} else {
			hasNextPage = false;
			nextPageCursor = '';
		}

		console.log('hasNextPage: ', hasNextPage);
		console.log('nextPageCursor: ', nextPageCursor);
	} while (hasNextPage);

	return replies;
}

export default fetchRepliesFromCastQueue;

export { fetchReplies };
