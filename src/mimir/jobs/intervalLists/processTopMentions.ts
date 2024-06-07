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

	await storeTopMentionsInFirebase(fid, impactResult.rows, label);
};

export default processTopMentions;
