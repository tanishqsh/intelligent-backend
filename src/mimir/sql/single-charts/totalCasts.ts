function totalCasts_24H(fid: number) {
	return `WITH hour_series AS (
            SELECT generate_series(
                date_trunc('hour', NOW() - INTERVAL '24 hours'),
                date_trunc('hour', NOW()),
                '1 hour'::interval
            ) AS hour
        ),
        cast_events AS (
            SELECT
                fid AS user_id,
                date_trunc('hour', timestamp) AS hour,
                COUNT(*) AS casts
            FROM casts
            WHERE
                fid = ${fid} AND
                timestamp >= NOW() - INTERVAL '24 hours' AND
                deleted_at IS NULL
            GROUP BY user_id, hour
        )
        SELECT
            h.hour AS interval,
            COALESCE(c.casts, 0) AS casts
        FROM
            hour_series h
        LEFT JOIN
            cast_events c ON h.hour = c.hour
        ORDER BY
            h.hour;`;
}

function totalCasts_7D(fid: number) {
	return `WITH day_series AS (
            SELECT generate_series(
                date_trunc('day', NOW() - INTERVAL '7 days'),
                date_trunc('day', NOW()),
                '1 day'::interval
            ) AS day
        ),
        cast_events AS (
            SELECT
                fid AS user_id,
                date_trunc('day', timestamp) AS day,
                COUNT(*) AS casts
            FROM casts
            WHERE
                fid = ${fid} AND
                timestamp >= NOW() - INTERVAL '7 days' AND
                deleted_at IS NULL
            GROUP BY user_id, day
        )
        SELECT
            d.day AS interval,
            COALESCE(c.casts, 0) AS casts
        FROM
            day_series d
        LEFT JOIN
            cast_events c ON d.day = c.day
        ORDER BY
            d.day;`;
}

function totalCasts_30D(fid: number) {
	return `WITH day_series AS (
            SELECT generate_series(
                date_trunc('day', NOW() - INTERVAL '30 days'),
                date_trunc('day', NOW()),
                '1 day'::interval
            ) AS day
        ),
        cast_events AS (
            SELECT
                fid AS user_id,
                date_trunc('day', timestamp) AS day,
                COUNT(*) AS casts
            FROM casts
            WHERE
                fid = ${fid} AND
                timestamp >= NOW() - INTERVAL '30 days' AND
                deleted_at IS NULL
            GROUP BY user_id, day
        )
        SELECT
            d.day AS interval,
            COALESCE(c.casts, 0) AS casts
        FROM
            day_series d
        LEFT JOIN
            cast_events c ON d.day = c.day
        ORDER BY
            d.day;`;
}

function totalCasts_180D(fid: number) {
	return `WITH week_series AS (
            SELECT generate_series(
                date_trunc('week', NOW() - INTERVAL '180 days'),
                date_trunc('week', NOW()),
                '1 week'::interval
            ) AS week
        ),
        cast_events AS (
            SELECT
                fid AS user_id,
                date_trunc('week', timestamp) AS week,
                COUNT(*) AS casts
            FROM casts
            WHERE
                fid = ${fid} AND
                timestamp >= NOW() - INTERVAL '180 days' AND
                deleted_at IS NULL
            GROUP BY user_id, week
        )
        SELECT
            w.week AS interval,
            COALESCE(c.casts, 0) AS casts
        FROM
            week_series w
        LEFT JOIN
            cast_events c ON w.week = c.week
        ORDER BY
            w.week;`;
}

export { totalCasts_24H, totalCasts_7D, totalCasts_30D, totalCasts_180D };
