-- Optional, TARGET ONLY. Run after copying storage files and before cutover:
-- psql --set=old_url=https://OLD.supabase.co --set=new_url=https://NEW ... -f this-file
-- Only stored Supabase Storage endpoint prefixes change. UUIDs, file paths,
-- numbers and all other fields are retained, including those inside JSON.
\set ON_ERROR_STOP on
BEGIN;
-- Preserve historical timestamps and avoid recalibrating materials on URL edits.
SET LOCAL session_replication_role = replica;
SELECT format(
  'UPDATE %I.%I SET %I = replace(%I::text, %L, %L)::%s WHERE strpos(%I::text, %L) > 0;',
  c.table_schema, c.table_name, c.column_name, c.column_name,
  rtrim(:'old_url', '/') || '/storage/v1/', rtrim(:'new_url', '/') || '/storage/v1/',
  CASE WHEN c.data_type = 'jsonb' THEN 'jsonb' WHEN c.data_type = 'json' THEN 'json' ELSE 'text' END,
  c.column_name, rtrim(:'old_url', '/') || '/storage/v1/'
)
FROM information_schema.columns c
JOIN information_schema.tables t USING (table_catalog, table_schema, table_name)
WHERE c.table_schema = 'public' AND t.table_type = 'BASE TABLE'
  AND c.data_type IN ('text', 'character varying', 'json', 'jsonb')
  AND c.is_generated = 'NEVER'
ORDER BY c.table_name, c.ordinal_position
\gexec
COMMIT;
