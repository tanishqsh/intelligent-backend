import { query } from '../../mimir';
import Duration from '../../sql/castsQueries/Duration';
import { getUserTopCasts } from '../../sql/castsQueries/castsQueries';
import { storeTopCastsInFirebase } from './storageFunctions';

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

	await storeTopCastsInFirebase(fid, topCastsResult.rows, label);
};

export default processTopCasts;
