import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://azovkkvaqfdtyanjkdal.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6b3Zra3ZhcWZkdHlhbmprZGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODgyNjksImV4cCI6MjA2NTI2NDI2OX0.y-9FPJbGl-B0hGJEiEGliPFFdNi5MuzsQLdq9nrAhe4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);