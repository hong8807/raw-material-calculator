import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 데이터베이스 타입 정의
export interface DrugItem {
  id: number;
  product_code: number;
  product_name: string;
  company_name: string;
  manufacturer_name: string;
  rx_otc: string;
  ingredient_name: string;
  amount: string;
  unit: string;
  standard?: string; // 규격 정보 추가
  pack_info?: string;
  appearance_info?: string;
  price_insurance?: number;
  production_2023_won?: number;
  permit_date?: string;
  storage_method?: string;
  usage_period?: string;
  atc_code?: string;
  // 클라이언트 전용 필드 (수기 입력용)
  manual_production?: number;
  manual_usage?: number;
}

// 데이터 조회 함수
export async function searchDrugs(
  ingredient?: string,
  manufacturer?: string,
  limit: number = 1000
) {
  let query = supabase
    .from('drug_items')
    .select('*')
    .limit(limit);

  if (ingredient) {
    query = query.ilike('ingredient_name', `%${ingredient}%`);
  }

  if (manufacturer) {
    query = query.ilike('manufacturer_name', `%${manufacturer}%`);
  }

  const { data, error } = await query
    .order('production_2023_won', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('Supabase 조회 오류:', error);
    return [];
  }

  return data || [];
}