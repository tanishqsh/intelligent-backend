export function chart1Query24D(fid: number): string {
	return `WITH hour_series AS (
      SELECT generate_series(
        date_trunc('hour', NOW() - INTERVAL '24 hours'),
        date_trunc('hour', NOW()),
        '1 hour'::interval
      ) AS hour
    ),
    follower_events AS (
      SELECT
        target_fid AS user_id,
        date_trunc('hour', timestamp) AS hour,
        COUNT(*) AS new_followers,
        0 AS likes,
        0 AS recasts
      FROM links
      WHERE
        type = 'follow' AND
        target_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '24 hours' AND
        deleted_at IS NULL
      GROUP BY user_id, hour
    ),
    like_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('hour', timestamp) AS hour,
        0 AS new_followers,
        COUNT(*) AS likes,
        0 AS recasts
      FROM reactions
      WHERE
        type = 'like' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '24 hours' AND
        deleted_at IS NULL
      GROUP BY user_id, hour
    ),
    recast_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('hour', timestamp) AS hour,
        0 AS new_followers,
        0 AS likes,
        COUNT(*) AS recasts
      FROM reactions
      WHERE
        type = 'recast' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '24 hours' AND
        deleted_at IS NULL
      GROUP BY user_id, hour
    ),
    combined_events AS (
      SELECT
        user_id,
        hour,
        SUM(new_followers) AS new_followers,
        SUM(likes) AS likes,
        SUM(recasts) AS recasts
      FROM (
        SELECT * FROM follower_events
        UNION ALL
        SELECT * FROM like_events
        UNION ALL
        SELECT * FROM recast_events
      ) AS events
      GROUP BY user_id, hour
    )
    SELECT
      h.hour,
      COALESCE(e.new_followers, 0) AS new_followers,
      COALESCE(e.likes, 0) AS likes,
      COALESCE(e.recasts, 0) AS recasts
    FROM
      hour_series h
    LEFT JOIN
      combined_events e ON h.hour = e.hour
    ORDER BY
      h.hour;`;
}

export function chart1Query7D(fid: number): string {
	return `
  WITH day_series AS (
      SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '7 days'),
        date_trunc('day', NOW()),
        '1 day'::interval
      ) AS day
    ),
    follower_events AS (
      SELECT
        target_fid AS user_id,
        date_trunc('day', timestamp) AS day,
        COUNT(*) AS new_followers,
        0 AS likes,
        0 AS recasts
      FROM links
      WHERE
        type = 'follow' AND
        target_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '7 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    like_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('day', timestamp) AS day,
        0 AS new_followers,
        COUNT(*) AS likes,
        0 AS recasts
      FROM reactions
      WHERE
        type = 'like' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '7 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    recast_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('day', timestamp) AS day,
        0 AS new_followers,
        0 AS likes,
        COUNT(*) AS recasts
      FROM reactions
      WHERE
        type = 'recast' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '7 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    combined_events AS (
      SELECT
        user_id,
        day,
        SUM(new_followers) AS new_followers,
        SUM(likes) AS likes,
        SUM(recasts) AS recasts
      FROM (
        SELECT * FROM follower_events
        UNION ALL
        SELECT * FROM like_events
        UNION ALL
        SELECT * FROM recast_events
      ) AS events
      GROUP BY user_id, day
    )
    SELECT
      d.day,
      COALESCE(e.new_followers, 0) AS new_followers,
      COALESCE(e.likes, 0) AS likes,
      COALESCE(e.recasts, 0) AS recasts
    FROM
      day_series d
    LEFT JOIN
      combined_events e ON d.day = e.day
    ORDER BY
      d.day;`;
}

export function chart1Query30D(fid: number): string {
	return `
  WITH day_series AS (
      SELECT generate_series(
        date_trunc('day', NOW() - INTERVAL '30 days'),
        date_trunc('day', NOW()),
        '1 day'::interval
      ) AS day
    ),
    follower_events AS (
      SELECT
        target_fid AS user_id,
        date_trunc('day', timestamp) AS day,
        COUNT(*) AS new_followers,
        0 AS likes,
        0 AS recasts
      FROM links
      WHERE
        type = 'follow' AND
        target_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '30 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    like_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('day', timestamp) AS day,
        0 AS new_followers,
        COUNT(*) AS likes,
        0 AS recasts
      FROM reactions
      WHERE
        type = 'like' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '30 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    recast_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('day', timestamp) AS day,
        0 AS new_followers,
        0 AS likes,
        COUNT(*) AS recasts
      FROM reactions
      WHERE
        type = 'recast' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '30 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    combined_events AS (
      SELECT
        user_id,
        day,
        SUM(new_followers) AS new_followers,
        SUM(likes) AS likes,
        SUM(recasts) AS recasts
      FROM (
        SELECT * FROM follower_events
        UNION ALL
        SELECT * FROM like_events
        UNION ALL
        SELECT * FROM recast_events
      ) AS events
      GROUP BY user_id, day
    )
    SELECT
      d.day,
      COALESCE(e.new_followers, 0) AS new_followers,
      COALESCE(e.likes, 0) AS likes,
      COALESCE(e.recasts, 0) AS recasts
    FROM
      day_series d
    LEFT JOIN
      combined_events e ON d.day = e.day
    ORDER BY
      d.day;`;
}

export function chart1Query180D(fid: number): string {
	return `
  WITH day_series AS (
      SELECT generate_series(
        date_trunc('week', NOW() - INTERVAL '180 days'),
        date_trunc('week', NOW()),
        '1 week'::interval
      ) AS day
    ),
    follower_events AS (
      SELECT
        target_fid AS user_id,
        date_trunc('week', timestamp) AS day,
        COUNT(*) AS new_followers,
        0 AS likes,
        0 AS recasts
      FROM links
      WHERE
        type = 'follow' AND
        target_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '180 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    like_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('week', timestamp) AS day,
        0 AS new_followers,
        COUNT(*) AS likes,
        0 AS recasts
      FROM reactions
      WHERE
        type = 'like' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '180 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    recast_events AS (
      SELECT
        target_cast_fid AS user_id,
        date_trunc('week', timestamp) AS day,
        0 AS new_followers,
        0 AS likes,
        COUNT(*) AS recasts
      FROM reactions
      WHERE
        type = 'recast' AND
        target_cast_fid = ${fid} AND
        timestamp >= NOW() - INTERVAL '180 days' AND
        deleted_at IS NULL
      GROUP BY user_id, day
    ),
    combined_events AS (
      SELECT
        user_id,
        day,
        SUM(new_followers) AS new_followers,
        SUM(likes) AS likes,
        SUM(recasts) AS recasts
      FROM (
        SELECT * FROM follower_events
        UNION ALL
        SELECT * FROM like_events
        UNION ALL
        SELECT * FROM recast_events
      ) AS events
      GROUP BY user_id, day
    )
    SELECT
      d.day,
      COALESCE(e.new_followers, 0) AS new_followers,
      COALESCE(e.likes, 0) AS likes,
      COALESCE(e.recasts, 0) AS recasts
    FROM
      day_series d
    LEFT JOIN
      combined_events e ON d.day = e.day
    ORDER BY
      d.day;`;
}
