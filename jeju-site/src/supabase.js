import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 환경변수가 없으면 앱이 죽지 않고 안내 문구만 보여주도록 client 를 null 로 둔다.
export const hasSupabase = Boolean(url && key && !url.includes('xxxxxxxx'));
export const supabase = hasSupabase ? createClient(url, key) : null;
