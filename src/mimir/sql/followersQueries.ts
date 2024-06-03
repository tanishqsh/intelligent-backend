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

export function getIntervalFollowerCount(fid: number): string {
	return `
    SELECT 
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') AS followers_gain_24h,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '48 hours' AND timestamp < NOW() - INTERVAL '24 hours') AS followers_gain_prev_24h,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') AS followers_gain_7d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '14 days' AND timestamp < NOW() - INTERVAL '7 days') AS followers_gain_prev_7d,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 days') AS followers_gain_30d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '60 days' AND timestamp < NOW() - INTERVAL '30 days') AS followers_gain_prev_30d,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '180 days') AS followers_gain_180d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '360 days' AND timestamp < NOW() - INTERVAL '180 days') AS followers_gain_prev_180d
    FROM 
        links
    WHERE 
        target_fid = ${fid}
        AND deleted_at IS NULL;
    `;
}
