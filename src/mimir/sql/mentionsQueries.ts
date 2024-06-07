import Duration from './castsQueries/Duration';

export function getIntervalMentionsCount(fid: number): string {
	return `
    SELECT 
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') AS mentions_24h,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '48 hours' AND timestamp < NOW() - INTERVAL '24 hours') AS mentions_prev_24h,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') AS mentions_7d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '14 days' AND timestamp < NOW() - INTERVAL '7 days') AS mentions_prev_7d,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 days') AS mentions_30d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '60 days' AND timestamp < NOW() - INTERVAL '30 days') AS mentions_prev_30d,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '180 days') AS mentions_180d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '360 days' AND timestamp < NOW() - INTERVAL '180 days') AS mentions_prev_180d
FROM 
    casts
WHERE 
    mentions @> ARRAY[${fid}]::integer[];
`;
}

export function getTopMentionsByDuration(fid: number, duration: Duration) {
	return `
    WITH mentioned_casts AS (
    SELECT 
        c.fid,
        c.hash,
        c.timestamp,
        c.text,
        c.mentions,
        c.mentions_positions,
        c.embeds,
        p.data ->> 'username' AS username,
        p.data ->> 'display' AS display,
        p.data ->> 'pfp' AS profile_picture
    FROM 
        casts c
    JOIN 
        profiles p ON c.fid = p.fid
    WHERE 
        c.mentions @> ARRAY[${fid}]::integer[]
        AND c.timestamp >= NOW() - INTERVAL '${duration}'
),
cast_reactions AS (
    SELECT 
        target_cast_hash,
        COUNT(*) AS reaction_count
    FROM 
        reactions
    WHERE 
        target_cast_hash IN (SELECT hash FROM mentioned_casts)
        AND timestamp >= NOW() - INTERVAL '${duration}'
    GROUP BY 
        target_cast_hash
)
SELECT 
    mc.fid,
    mc.timestamp,
    mc.text,
    mc.mentions,
    mc.mentions_positions,
    mc.embeds,
    mc.username,
    mc.display,
    mc.profile_picture,
    COALESCE(cr.reaction_count, 0) AS reaction_count
FROM 
    mentioned_casts mc
LEFT JOIN 
    cast_reactions cr ON mc.hash = cr.target_cast_hash
ORDER BY 
    reaction_count DESC, mc.timestamp DESC
LIMIT 10;
`;
}
