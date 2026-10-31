\set ON_ERROR_STOP on
BEGIN TRANSACTION READ ONLY;
SELECT current_setting('server_version') AS postgres_version;
SELECT extname, extversion FROM pg_extension ORDER BY extname;
SELECT format('SELECT %L AS table_name, count(*) AS row_count FROM %I.%I;',
              schemaname || '.' || tablename, schemaname, tablename)
FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
\gexec
SELECT count(*) AS auth_user_count FROM auth.users;
SELECT b.id AS bucket, b.public, count(o.id) AS metadata_object_count
FROM storage.buckets b LEFT JOIN storage.objects o ON o.bucket_id = b.id
GROUP BY b.id, b.public ORDER BY b.id;
-- Database metadata counts do not prove that actual file bytes were transferred.
SELECT schemaname, tablename, count(*) AS policy_count
FROM pg_policies WHERE schemaname IN ('public', 'storage')
GROUP BY schemaname, tablename ORDER BY schemaname, tablename;
COMMIT;
