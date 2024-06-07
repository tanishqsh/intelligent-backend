import { query } from '../../mimir';
import { getImpactUnfollowersByDuration } from '../../sql/followersQueries';
import { storeImpactUnfollowersInFirebase } from './storageFunctions';

const processImpactUnfollowers = async (fid: number, duration: string, label: string) => {
	console.log(`[IntervalListsWorker] Initiating fetch process for impact unfollowers. FID: ${fid}, Duration: ${duration}`);
	const impactQuery = getImpactUnfollowersByDuration(fid, duration);
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

	await storeImpactUnfollowersInFirebase(fid, impactResult.rows, label);
};

export default processImpactUnfollowers;
