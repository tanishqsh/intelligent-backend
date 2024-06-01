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

export function getFollowersPerHourLast24Hours(fid: number): string {
	return `
    WITH follower_events AS (
    SELECT
        target_fid AS user_id,
        date_trunc('hour', timestamp) AS hour,
        COUNT(*) AS new_followers
    FROM links
    WHERE
        type = 'follow' AND
        target_fid = ${fid} AND 
        timestamp >= NOW() - INTERVAL '24 hours' AND
        deleted_at IS NULL
    GROUP BY user_id, hour
)
SELECT
    hour,
    new_followers
FROM
    follower_events
ORDER BY
    hour;`;
}
