import { fetchQuery } from '@airstack/node';
import { getCastMetaByHashQuery } from '../../../utils/airstack-query-constructors/getCastMetaByHashQuery';
import { query } from '../../mimir';
import Duration from '../../sql/castsQueries/Duration';
import { getTopMentionsByDuration } from '../../sql/mentionsQueries';
import { storeTopMentionsInFirebase } from './storageFunctions';

const processTopMentions = async (fid: number, duration: Duration, label: string) => {
	console.log(`[IntervalListsWorker] Initiating fetch process for top mentions. FID: ${fid}, Duration: ${duration}`);
	const impactQuery = getTopMentionsByDuration(fid, duration);
	const impactStart = Date.now();
	let impactResult;
	try {
		impactResult = await query(impactQuery);
	} catch (error) {
		console.error(`[IntervalListsWorker] Error executing top mentions query for FID: ${fid}, Label: ${label}`, error);
		return;
	}
	const impactQueryDuration = Date.now() - impactStart;

	console.log(`✅ [IntervalListsWorker] Top mentions query duration for FID: ${fid}, Label: ${label} - ${impactQueryDuration}ms`);

	if (!impactResult.rows.length) {
		console.log(`[IntervalListsWorker] Top mentions found for FID: ${fid}, Label: ${label}`);
		return;
	}

	const casts = impactResult.rows;

	// loop thru and print cast_hash
	for (const cast of casts) {
		let meta = null;
		try {
			meta = await getCastMetadata(cast.hash);

			// add meta to cast object
			cast.meta = meta;
		} catch (error) {
			console.error(`Failed to fetch metadata for cast with hash ${cast.cast_hash}:`, error);
		}
	}

	await storeTopMentionsInFirebase(fid, impactResult.rows, label);
};

const getCastMetadata = async (hash: any) => {
	const castHash = hash;

	let q = '';
	let castMetaResult: any;

	q = getCastMetaByHashQuery(castHash);
	castMetaResult = await fetchQuery(q);
	castMetaResult = castMetaResult?.data?.FarcasterCasts?.Cast[0];

	return castMetaResult;
};

export default processTopMentions;
