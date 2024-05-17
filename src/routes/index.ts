import express from 'express';
import { neynar } from '../neynar/neynar';

import { CastParamType, ReactionsType } from '@neynar/nodejs-sdk';
import { fetchQuery, fetchQueryWithPagination } from '@airstack/node';
import { getCastByUrlQuery } from '../utils/query-constructors/getCastByUrlQuery';
import checkIfWhitelisted from '../middleware/checkIfWhitelisted';
import { addCastToDB } from '../db/addCastToDB';
import { fetchCastFromDBUsingUrl } from '../db/fetchCastFromDBUsingUrl';
import { getRepliesByUrlQuery } from '../utils/query-constructors/getRepliesByUrlQuery';

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
	const { data: repliesData, error: repliesError } = await fetchQuery(getRepliesByUrlQuery(castUrl));

	if (error || repliesError) {
		return res.status(500).json({
			message: 'An error occurred while fetching the data',
			error: error,
		});
	}

	let cast = data?.FarcasterCasts?.Cast[0];

	if (!data || !cast) {
		return res.status(404).json({
			message: 'No data found for the given URL',
		});
	}

	addCastToDB(cast);

	res.json({
		repliesData: repliesData,
		cast: data.FarcasterCasts.Cast[0],
	});
});

export default router;
