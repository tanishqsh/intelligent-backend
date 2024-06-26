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

export function getImpactFollowersByDuration(fid: number, duration: string): string {
	return `
    WITH recent_follows AS (
    SELECT fid, timestamp
    FROM links
    WHERE target_fid = ${fid}
      AND deleted_at IS NULL
      AND timestamp >= NOW() - INTERVAL '${duration}'
)

SELECT 
    rf.fid AS follower_fid, 
    rf.timestamp AS follow_timestamp,
    fc.follower_count, 
    p.data->>'display' AS display_name, 
    p.data->>'username' AS username, 
    p.data->>'pfp' AS pfp
FROM recent_follows rf
JOIN follower_counts_mv fc ON rf.fid = fc.fid
JOIN profiles p ON rf.fid = p.fid
WHERE fc.follower_count > 10000
ORDER BY fc.follower_count DESC
LIMIT 25;
    `;
}

export function getImpactUnfollowersByDuration(fid: number, duration: string): string {
	return `
    WITH recent_unfollows AS (
    SELECT fid, deleted_at AS timestamp
    FROM links
    WHERE target_fid = ${fid}
      AND deleted_at IS NOT NULL
      AND deleted_at >= NOW() - INTERVAL '${duration}'
)

SELECT 
    ru.fid AS unfollower_fid, 
    ru.timestamp AS unfollow_timestamp,
    fc.follower_count, 
    p.data->>'display' AS display_name, 
    p.data->>'username' AS username, 
    p.data->>'pfp' AS pfp
FROM recent_unfollows ru
JOIN follower_counts_mv fc ON ru.fid = fc.fid
JOIN profiles p ON ru.fid = p.fid
WHERE fc.follower_count > 10000
ORDER BY fc.follower_count DESC
LIMIT 25;
    `;
}
