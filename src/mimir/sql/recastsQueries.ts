export function getRecastsPerHourLast24Hours(fid: number): string {
	return `
    WITH hour_series AS (
    SELECT generate_series(
        DATE_TRUNC('hour', NOW() - INTERVAL '24 hours'),
        DATE_TRUNC('hour', NOW()),
        '1 hour'::interval
    ) AS hour
),
reaction_counts AS (
    SELECT
        DATE_TRUNC('hour', timestamp) AS hour,
        COUNT(*) AS count
    FROM
        reactions
    WHERE
        target_cast_fid = ${fid} -- Replace with the specific Farcaster ID
        AND timestamp >= NOW() - INTERVAL '24 hours'
        AND deleted_at IS NULL
        AND type = 'recast'
    GROUP BY
        DATE_TRUNC('hour', timestamp)
)
SELECT
    h.hour,
    COALESCE(r.count, 0) AS count
FROM
    hour_series h
LEFT JOIN
    reaction_counts r ON h.hour = r.hour
ORDER BY
    h.hour;`;
}
