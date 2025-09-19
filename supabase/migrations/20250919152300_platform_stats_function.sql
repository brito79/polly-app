-- Function to get platform-wide stats
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS TABLE (
  users_count bigint,
  polls_count bigint,
  votes_count bigint,
  active_polls_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles) AS users_count,
    (SELECT COUNT(*) FROM polls) AS polls_count,
    (SELECT COUNT(*) FROM votes) AS votes_count,
    (SELECT COUNT(*) FROM polls WHERE is_active = true) AS active_polls_count;
END;
$$;