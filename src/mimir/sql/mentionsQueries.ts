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
