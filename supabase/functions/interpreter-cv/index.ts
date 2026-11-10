import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0'
import { createCvHandler } from './handler.js'

// Authentication is performed with Auth getUser(token) and the database management role.
Deno.serve(createCvHandler({ createClient, env: (name: string) => Deno.env.get(name) ?? '' }))
