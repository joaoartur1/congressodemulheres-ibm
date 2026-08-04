import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Cliente com a service_role key — só pode ser importado por código que
// roda no servidor (Route Handlers). Nunca deve chegar no bundle do
// navegador: ele ignora RLS e tem acesso irrestrito ao banco.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
