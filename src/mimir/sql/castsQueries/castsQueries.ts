import Duration from './Duration';

/**
 *
 * @param fid  - Farcaster ID
 * @param duration - Duration
 * @returns SQL query to get the top casts of a user based on the number of reactions in the given duration
 */
export function getUserTopCasts(fid: number, duration: Duration = Duration.HOURS_24) {
	return `
    WITH user_casts AS (
    SELECT
        c.fid AS user_fid,
        c.hash AS cast_hash,
        c.timestamp AS cast_time,
        c.embeds,
        c.parent_cast_url,
        c.parent_cast_fid,
        c.parent_cast_hash,
        c.text,
        c.mentions,
        c.mentions_positions,
        COUNT(r.fid) AS engagement_count
    FROM casts c
    LEFT JOIN reactions r ON c.hash = r.target_cast_hash AND r.deleted_at IS NULL
    WHERE c.fid = ${fid} AND c.deleted_at IS NULL AND c.timestamp >= NOW() - INTERVAL '${duration}'
    GROUP BY c.fid, c.hash, c.timestamp, c.embeds, c.parent_cast_url, c.parent_cast_fid, c.parent_cast_hash, c.text, c.mentions, c.mentions_positions
)
SELECT
    user_fid,
    cast_hash,
    cast_time,
    embeds,
    parent_cast_url,
    parent_cast_fid,
    parent_cast_hash,
    text,
    mentions,
    mentions_positions,
    engagement_count
FROM user_casts
WHERE user_fid IS NOT NULL
ORDER BY engagement_count DESC
LIMIT 10;
`;
}
