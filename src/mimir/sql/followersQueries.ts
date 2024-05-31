/**
 *
 * @param fid - Farcaster ID
 * @returns SQL query to get the followers count of a user
 */

export function getFollowersCount(fid: number): string {
	return `
    SELECT 
        target_fid AS user_id,
        COUNT(*) AS followers_count
    FROM 
        links
    WHERE 
        type = 'follow' AND 
        deleted_at IS NULL AND
        target_fid = ${fid}
    GROUP BY 
        target_fid
    ORDER BY 
        followers_count DESC;`;
}
