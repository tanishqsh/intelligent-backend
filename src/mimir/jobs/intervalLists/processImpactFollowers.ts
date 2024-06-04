import { query } from '../../mimir';
import { getImpactFollowersByDuration } from '../../sql/followersQueries';
import { storeImpactFollowersInFirebase } from './storageFunctions';

const processImpactFollowers = async (fid: number, duration: string, label: string) => {
	console.log(`[IntervalListsWorker] Initiating fetch process for impact followers. FID: ${fid}, Duration: ${duration}`);
	const impactQuery = getImpactFollowersByDuration(fid, duration);
	const impactStart = Date.now();
	let impactResult;
	try {
		impactResult = await query(impactQuery);
	} catch (error) {
		console.error(`[IntervalListsWorker] Error executing impact followers query for FID: ${fid}, Label: ${label}`, error);
		return;
	}
	const impactQueryDuration = Date.now() - impactStart;

	console.log(`✅ [IntervalListsWorker] Impact followers query duration for FID: ${fid}, Label: ${label} - ${impactQueryDuration}ms`);

	if (!impactResult.rows.length) {
		console.log(`[IntervalListsWorker] No impact followers found for FID: ${fid}, Label: ${label}`);
		return;
	}

	await storeImpactFollowersInFirebase(fid, impactResult.rows, label);
};

export default processImpactFollowers;
