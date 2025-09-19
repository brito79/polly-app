-- Create the get_platform_stats function
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS TABLE (
    users_count bigint,
    polls_count bigint,
    votes_count bigint,
    active_polls_count bigint
) SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM profiles)::bigint AS users_count,
        (SELECT COUNT(*) FROM polls)::bigint AS polls_count,
        (SELECT COUNT(*) FROM votes)::bigint AS votes_count,
        (SELECT COUNT(*) FROM polls WHERE is_active = true)::bigint AS active_polls_count;
END;
$$ LANGUAGE plpgsql;