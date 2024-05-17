import express from 'express';
import { neynar } from '../neynar/neynar';

import { CastParamType, ReactionsType } from '@neynar/nodejs-sdk';
import { fetchQuery, fetchQueryWithPagination } from '@airstack/node';
import { getCastByUrlQuery } from '../utils/query-constructors/getCastByUrlQuery';
import checkIfWhitelisted from '../middleware/checkIfWhitelisted';
import { addCastToDB } from '../db/addCastToDB';
import { fetchCastFromDBUsingUrl } from '../db/fetchCastFromDBUsingUrl';
import { getRepliesByUrlQuery } from '../utils/query-constructors/getRepliesByUrlQuery';
import fetchRepliesFromCastQueue, { fetchReplies } from '../queues/fetchRepliesFromCastQueue';
import { fetchRepliesFromDBUsingUrl } from '../db/fetchRepliesFromDBUsingUrl';

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

router.get('/get-replies', checkIfWhitelisted, async (req, res) => {
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

router.get('/get-cast', checkIfWhitelisted, async (req, res) => {
	const castUrl = req.query.castUrl;

	if (!castUrl || typeof castUrl !== 'string' || !castUrl.startsWith('http')) {
		return res.status(400).json({
			message: 'Please provide a valid URL',
		});
	}

	// we first check with firebase if the cast is already present in the database
	// const castData = await fetchCastFromDBUsingUrl(castUrl);

	// if (castData) {
	// 	return res.json({
	// 		message: 'Cast found in the database',
	// 		cast: castData,
	// 	});
	// }

	const { data, error } = await fetchQuery(getCastByUrlQuery(castUrl));

	if (error) {
		return res.status(500).json({
			message: 'An error occurred while fetching the data',
			error: error,
		});
	}

	console.log('Data: ', data);

	let cast = data?.FarcasterCasts?.Cast[0];

	if (!data || !cast) {
		return res.status(404).json({
			message: 'No data found for the given URL',
		});
	}

	// const replies = await fetchReplies(cast.url);

	addCastToDB(cast);

	const job = await fetchRepliesFromCastQueue.add(`fetchRepliesForCast: ${cast.hash} by ${cast.fid}`, cast.url);

	if (job) {
		console.log('Cast added to queue to fetch replies ✅');
	} else {
		console.log('Failed to add cast to queue to fetch replies ❌');
	}
	/**
	 * We start fetching the reactions for the cast by putting it in the queue (likes, replies, etc.)
	 */

	res.json({
		cast: data.FarcasterCasts.Cast[0],
	});
});

export default router;
