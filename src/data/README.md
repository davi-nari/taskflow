# Data layer

TaskFlow v1.5.0 uses Supabase as persistent storage while keeping a local cache for the existing synchronous Vue UI.

- `supabaseApi.js` - small dependency-free Supabase Auth/REST/RPC client using the project URL and publishable key from Vite env.
- `supabaseRepository.js` - maps the local nested TaskFlow model to normalized Supabase tables and serializes background writes.
- `workspaceBootstrap.js` - loads the authenticated user's workspace before private routes render and performs the one-time legacy localStorage migration when the remote workspace is empty.
- `managerDataSource.js` - loads the public sanitized manager snapshot through the security-definer RPC.
- `managerAccess.js` - creates/rotates the manager token; only its SHA-256 hash is stored in Supabase.

Private data is protected by RLS. The manager RPC intentionally excludes `work_sessions`, `breaks` and planned minutes.
