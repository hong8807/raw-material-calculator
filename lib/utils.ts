import { DrugItem } from './supabase';

// 단위를 kg으로 변환하는 함수
export function unitToKg(amount: string | number, unit: string): number | null {
  const amountNum = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(amountNum)) return null;

  // unit이 null이거나 undefined인 경우 처리
  if (!unit) return null;

  const u = unit.trim().toLowerCase();

  // 그램 단위
  if ((u === 'g' || u === '그램' || u === 'gram') && !u.includes('m') && !u.includes('μ')) {
    return amountNum / 1000;
  }

  // 밀리그램 단위
  if (u.includes('mg') || u.includes('밀리그램') || u.includes('밀리그람') || u === '㎎' || u === 'milligram') {
    return amountNum / 1000000;
  }

  // 마이크로그램 단위
  if (u.includes('μg') || u.includes('mcg') || u.includes('마이크로그램') || u.includes('마이크로그람') || u === '㎍' || u === 'microgram') {
    return amountNum / 1000000000;
  }

  // 킬로그램 단위
  if (u === 'kg' || u === '킬로그램' || u === 'kilogram') {
    return amountNum;
  }

  // 리터 단위 (물 기준 1L = 1kg)
  if (u === 'l' || u === '리터' || u === 'liter') {
    return amountNum;
  }

  // 밀리리터 단위 (물 기준 1ml = 1g)
  if (u === 'ml' || u === '밀리리터' || u === '㎖' || u === 'milliliter') {
    return amountNum / 1000;
  }

  // 변환 불가능한 단위 (%, IU, v/v% 등)
  return null;
}

// 원료 사용량 계산 함수
export function calculateRawMaterialUsage(item: DrugItem): number {
  // 수기 입력값이 있으면 우선 사용
  if (item.manual_usage) {
    return item.manual_usage;
  }

  // 보험약가나 생산실적이 없으면 계산 불가
  if (!item.price_insurance || !item.production_2023_won || item.price_insurance === 0) {
    return 0;
  }

  // 생산량 계산 (포장 수)
  const production = item.manual_production || (item.production_2023_won / item.price_insurance);

  // 단위 변환 (kg)
  const kgPerUnit = unitToKg(item.amount, item.unit);

  if (!kgPerUnit) {
    return 0;
  }

  // 원료 사용량 계산
  return production * kgPerUnit;
}

// 숫자 포맷팅 함수 (천단위 콤마 추가)
export function formatNumber(num: number, decimals: number = 2): string {
  if (num === 0) return '0';
  if (num < 0.01 && decimals === 2) {
    return num.toExponential(2);
  }
  // 소수점 처리 후 천단위 콤마 추가
  const formatted = num.toFixed(decimals).replace(/\.?0+$/, '');
  const parts = formatted.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

// 원화 포맷팅 함수
export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(num);
}

// CSV 내보내기 함수
export function exportToCSV(items: DrugItem[]) {
  const headers = [
    '품목코드',
    '제품명',
    '판매사',
    '생산처',
    '전문/일반',
    '성분명',
    '분량',
    '단위',
    '규격',
    '성상정보',
    '보험약가',
    '생산실적(백만원)',
    '원료사용량(kg)',
    '주의사항'
  ];

  const rows = items.map(item => {
    const usage = calculateRawMaterialUsage(item);
    const hasWarning = item.appearance_info && item.appearance_info.includes('그외');

    return [
      item.product_code,
      item.product_name,
      item.company_name,
      item.manufacturer_name,
      item.rx_otc || '',
      item.ingredient_name,
      item.amount,
      item.unit,
      item.standard || '',
      item.appearance_info || '',
      item.price_insurance || 0,
      item.production_2023_won ? formatNumber(item.production_2023_won / 1000000, 1) : 0,
      formatNumber(usage, 3),
      hasWarning ? '원료산정 주의' : ''
    ];
  });

  // BOM 추가 (엑셀에서 한글 깨짐 방지)
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `원료사용량_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}