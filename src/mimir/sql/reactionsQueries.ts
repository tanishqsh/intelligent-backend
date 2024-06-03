export function getIntervalReactionsCount(fid: number): string {
	return `
    SELECT 
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 hours') AS reactions_24h,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '48 hours' AND timestamp < NOW() - INTERVAL '24 hours') AS reactions_prev_24h,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 days') AS reactions_7d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '14 days' AND timestamp < NOW() - INTERVAL '7 days') AS reactions_prev_7d,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 days') AS reactions_30d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '60 days' AND timestamp < NOW() - INTERVAL '30 days') AS reactions_prev_30d,
    
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '180 days') AS reactions_180d,
    COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '360 days' AND timestamp < NOW() - INTERVAL '180 days') AS reactions_prev_180d
FROM 
    reactions
WHERE 
    target_cast_fid = ${fid};`;
}
