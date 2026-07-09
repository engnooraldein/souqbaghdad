# Supabase Data Egress Protection Rule
- **CRITICAL**: Always prioritize protecting the application from excessive data egress to ensure it stays on the Supabase free tier.
- NEVER write queries that pull entire tables (e.g. `select('*')`) without applying strict `.limit()` constraints (e.g., `limit(100)` or `limit(500)`).
- NEVER place Supabase fetch requests directly inside the component body (Fetch in Render). They must be safely wrapped inside hooks like `useEffect`.
- ALWAYS verify `useEffect` dependency arrays when writing Supabase queries. Avoid `[]` omissions or depending on objects/arrays that change frequently, which would cause infinite fetch loops.
- Avoid recurring intervals (`setInterval`) that pull large datasets.
