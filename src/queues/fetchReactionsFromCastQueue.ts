import { Queue, Worker } from 'bullmq';
import connectionOptions from '../utils/redisConnection';
import { fetchQueryWithPagination } from '@airstack/node';
import { getRepliesByUrlQuery } from '../utils/query-constructors/getRepliesByUrlQuery';
import { addRepliesToDB } from '../db/addRepliesToDB';
import { getLikesByUrlQuery } from '../utils/query-constructors/getLikesByUrlQuery';
import { getRecastsByUrlQuery } from '../utils/query-constructors/getRecastsByUrlQuery';
import { addReactionsToDB } from '../db/addReactionsToDB';

let queueName = 'fetchReactionsFromCastQueue';

const fetchReactionsFromCastQueue = new Queue(queueName, { connection: connectionOptions });

// create a worker for the queue – what process should be done when a job is received
const fetchReactionsFromCastWorker = new Worker(
	queueName,
	async (job) => {
		console.log('[Reactions Worker], Processing Job: ', job.data);

		const likes = (await fetchLikes(job.data)) as any[];
		const recasts = (await fetchRecasts(job.data)) as any[];

		const reactions = [...likes, ...recasts];

		await addReactionsToDB(reactions);

		return job.data;
	},
	{ connection: connectionOptions }
);

// fetch all recasts for a URL
async function fetchRecasts(castURL: string) {
	let recasts: any[] = [];
	let cursor = '';
	let query = '';
	let hasNextPage = false;

	do {
		console.log('cursor: ', cursor);
		console.log('========= Fetching recasts for: ', castURL);

		query = getRecastsByUrlQuery(castURL, cursor);

		const { data, error } = await fetchQueryWithPagination(query);

		hasNextPage = data.FarcasterReactions.pageInfo.hasNextPage;

		console.log('Has next page: ', data.FarcasterReactions.pageInfo.hasNextPage);

		if (error) {
			console.error('Error fetching recasts: ', error);
			return;
		}

		recasts = [...recasts, ...data.FarcasterReactions.Reaction];

		// print the count of recasts
		console.log('Total recasts fetched: ', recasts.length);

		if (hasNextPage) {
			cursor = data.FarcasterReactions.pageInfo.nextCursor;
		}

		console.log('More casts exists.. continuing..', hasNextPage);
	} while (hasNextPage);

	recasts.forEach((recast) => {
		recast.reactionType = 'recast';
	});

	return recasts;
}

// fetch all likes for a URL
async function fetchLikes(castURL: string) {
	let likes: any[] = [];
	let cursor = '';
	let query = '';
	let hasNextPage = false;

	do {
		console.log('cursor: ', cursor);
		console.log('========= Fetching likes for: ', castURL);

		query = getLikesByUrlQuery(castURL, cursor);

		const { data, error } = await fetchQueryWithPagination(query);

		hasNextPage = data.FarcasterReactions.pageInfo.hasNextPage;

		console.log('Has next page: ', data.FarcasterReactions.pageInfo.hasNextPage);

		if (error) {
			console.error('Error fetching likes: ', error);
			return;
		}

		likes = [...likes, ...data.FarcasterReactions.Reaction];

		// print the count of likes
		console.log('Total likes fetched: ', likes.length);

		if (hasNextPage) {
			cursor = data.FarcasterReactions.pageInfo.nextCursor;
		}

		console.log('More casts exists.. continuing..', hasNextPage);
	} while (hasNextPage);

	likes.forEach((like) => {
		like.reactionType = 'like';
	});

	return likes;
}

export default fetchReactionsFromCastQueue;

export { fetchLikes, fetchRecasts };
