const SUPABASE_URL = "https://avmgecghjueelbduicfy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bWdlY2doanVlZWxiZHVpY2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0Njk1NTYsImV4cCI6MjA5OTA0NTU1Nn0.MEBvouQI9c0lIttA2bpIn1ewMl0igbM16z9St6O6Ub8";

// Inicializa o cliente global do Supabase
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
