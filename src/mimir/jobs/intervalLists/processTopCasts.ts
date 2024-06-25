import { fetchQuery } from '@airstack/node';
import { query } from '../../mimir';
import Duration from '../../sql/castsQueries/Duration';
import { getUserTopCasts } from '../../sql/castsQueries/castsQueries';
import { storeTopCastsInFirebase } from './storageFunctions';
import { getCastMetaByHashQuery } from '../../../utils/airstack-query-constructors/getCastMetaByHashQuery';
import { getReplyCastMetaByHashQuery } from '../../../utils/airstack-query-constructors/getReplyCastMetaByHashQuery';

const processTopCasts = async (fid: number, duration: Duration, label: string) => {
	console.log(`[IntervalListsWorker] Initiating fetch process for top casts. FID: ${fid}, Duration: ${duration}`);
	const topCastsQuery = getUserTopCasts(fid, duration);
	const topCastsStart = Date.now();
	const topCastsResult = await query(topCastsQuery);
	const topCastsQueryDuration = Date.now() - topCastsStart;

	console.log(`✅ [IntervalListsWorker] Top casts query duration for FID: ${fid}, Label: ${label} - ${topCastsQueryDuration}ms`);

	if (!topCastsResult.rows.length) {
		console.log(`[IntervalListsWorker] No top casts found for FID: ${fid}, Label: ${label}`);
		return;
	}

	const casts = topCastsResult.rows;

	// loop thru and print cast_hash
	for (const cast of casts) {
		let meta = null;
		try {
			meta = await getCastMetadata(cast);
			// add meta to cast object
			cast.meta = meta;
		} catch (error) {
			console.error(`Failed to fetch metadata for cast with hash ${cast.cast_hash}:`, error);
		}
	}

	await storeTopCastsInFirebase(fid, casts, label);
};

/**
 * 	Fetches the metadata for a cast or reply cast from AirStack
 * @param cast
 * @returns
 */
const getCastMetadata = async (cast: any) => {
	const isReply = cast.parent_cast_fid !== null;
	const castHash = cast.cast_hash;

	let q = '';
	let castMetaResult: any;

	if (isReply) {
		q = getReplyCastMetaByHashQuery(castHash);
		castMetaResult = await fetchQuery(q);
		castMetaResult = castMetaResult?.data?.FarcasterReplies?.Reply[0];
	} else {
		q = getCastMetaByHashQuery(castHash);
		castMetaResult = await fetchQuery(q);
		castMetaResult = castMetaResult?.data?.FarcasterCasts?.Cast[0];
	}

	return castMetaResult;
};

export default processTopCasts;
