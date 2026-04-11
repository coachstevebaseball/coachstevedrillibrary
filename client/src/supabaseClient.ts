import { createClient } from '@supabase/supabase-js'

// Replace these strings with your actual keys from Supabase Settings > API
const supabaseUrl = 'https://gmrrpvctlujsvhiwkivu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdtcnJwdmN0bHVqc3ZoaXdraXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjMyNjEsImV4cCI6MjA4NjczOTI2MX0.MMujjmcg34Ks_H3BMCN6bzJVcVk17qrihlCfsBYhcQE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)