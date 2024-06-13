import express from 'express';
import { neynar } from '../neynar/neynar';

import { CastParamType } from '@neynar/nodejs-sdk';
import { fetchQuery } from '@airstack/node';
import { getCastByUrlQuery } from '../utils/airstack-query-constructors/getCastByUrlQuery';
import { addCastToDB } from '../db/addCastToDB';
import fetchRepliesFromCastQueue, { fetchReplies } from '../queues/fetchRepliesFromCastQueue';
import { fetchRepliesFromDBUsingUrl } from '../db/fetchRepliesFromDBUsingUrl';
import fetchReactionsFromCastQueue, { fetchLikes, fetchRecasts } from '../queues/fetchReactionsFromCastQueue';
import checkPrivyToken from '../middleware/checkPrivyToken';
import { completeAFSubs } from '../ecosystems/completeAFSubs';

const router = express.Router();

router.get('/', (req, res) => {
	res.json({
		message: 'API route 🟡',
	});
});

router.get('/analyze', async (req, res) => {
	// get the castUrl from the query parameters
	const castUrl = req.query.castUrl;

	if (!castUrl || typeof castUrl !== 'string' || !castUrl.startsWith('http')) {
		return res.status(400).json({
			message: 'Please provide a valid URL',
		});
	}

	let data: any;

	try {
		data = await neynar.lookUpCastByHashOrWarpcastUrl(castUrl, CastParamType.Url);
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			message: 'An error occurred while analyzing the URL',
			error: error,
		});
	}

	if (!data || !data?.cast) {
		return res.status(404).json({
			message: 'No data found for the given URL',
		});
	}

	res.json({
		url: castUrl,
		message: 'Analyze route 🟡',
		data: data,
	});
});

// gets the replies just from our firebase DB
router.get('/get-replies', async (req, res) => {
	const castUrl = req.query.castUrl;
	const limit = parseInt(req.query.limit as string) || 50;
	const startAfter = req.query.startAfter || null;

	if (!castUrl || typeof castUrl !== 'string' || !castUrl.startsWith('http')) {
		return res.status(400).json({
			message: 'Please provide a valid URL',
		});
	}

	// we first check with firebase if the cast is already present in the database
	const castData = await fetchRepliesFromDBUsingUrl(castUrl, limit, startAfter);

	if (castData) {
		return res.json({
			message: 'Replies found in the database',
			replies: castData,
		});
	} else {
		return res.json({
			message: 'No replies found in the database',
			replies: [],
		});
	}
});

router.get('/get-reactions', async (req, res) => {
	const castUrl = req.query.castUrl;

	if (!castUrl || typeof castUrl !== 'string' || !castUrl.startsWith('http')) {
		return res.status(400).json({
			message: 'Please provide a valid URL',
		});
	}

	// add the data to the queue

	const job = await fetchReactionsFromCastQueue.add(`fetchReactionsForCast: ${castUrl}`, castUrl);

	if (job) {
		console.log('Cast added to queue to fetch reactions ✅');
	} else {
		console.log('Failed to add cast to queue to fetch reactions ❌');
	}

	res.json({
		message: 'Reactions fetching initiated',
	});
});

router.get('/sync-cast', checkPrivyToken, async (req, res) => {
	const castUrl = req.query.castUrl;

	if (!castUrl || typeof castUrl !== 'string' || !castUrl.startsWith('http')) {
		return res.status(400).json({
			message: 'Please provide a valid URL',
		});
	}

	const { data, error } = await fetchQuery(getCastByUrlQuery(castUrl));

	if (error) {
		return res.status(500).json({
			message: 'An error occurred while fetching the data',
			error: error,
		});
	}

	// if there is no cast hash, it means it is not a farcaster cast, or the cast is not found, or it is NEW

	if (!data?.FarcasterCasts?.Cast[0]?.hash) {
		return res.status(404).json({
			message: 'No data found for the given URL',
		});
	}

	console.log('Synching Cash With Hash: ', data?.FarcasterCasts?.Cast[0].hash);

	let cast = data?.FarcasterCasts?.Cast[0];

	if (!data || !cast) {
		console.log('No data found for the given URL');

		return res.status(404).json({
			message: 'No data found for the given URL',
		});
	}

	addCastToDB(cast);

	const job = await fetchRepliesFromCastQueue.add(`fetchRepliesForCast: ${cast.hash} by ${cast.fid}`, cast.url);

	if (job) {
		console.log('Cast added to queue to fetch replies ✅');
	} else {
		console.log('Failed to add cast to queue to fetch replies ❌');
	}

	const reactionsJob = await fetchReactionsFromCastQueue.add(`fetchReactionsForCast: ${cast.hash} by ${cast.fid}`, cast.url);

	if (reactionsJob) {
		console.log('Cast added to queue to fetch reactions ✅');
	} else {
		console.log('Failed to add cast to queue to fetch reactions ❌');
	}

	return res.json({
		cast: data.FarcasterCasts.Cast[0],
		message: 'Syncing cast',
		success: true,
	});
});

export default router;
