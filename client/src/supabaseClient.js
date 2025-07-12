import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://jhfnlgimbmuraotitlge.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZm5sZ2ltYm11cmFvdGl0bGdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNjg0NzUsImV4cCI6MjA2Njg0NDQ3NX0.R_KhDkNJusqL-NVOqInHSmKE4OJ7DKt6LlJaE8WQevI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
