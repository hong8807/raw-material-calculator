import { DrugItem } from './supabase';
import { calculateRawMaterialUsage, formatNumber } from './utils';

// 실생산처별 데이터 집계 (성분명 검색 시)
export function aggregateByManufacturer(items: DrugItem[], limit: number = 10) {
  const manufacturerData = new Map<string, { tablet: number; other: number }>();

  items.forEach(item => {
    const manufacturer = item.manufacturer_name;
    if (!manufacturer) return;

    const isTabletOrCapsule = !item.appearance_info ||
      !item.appearance_info.includes('그외');

    if (!manufacturerData.has(manufacturer)) {
      manufacturerData.set(manufacturer, { tablet: 0, other: 0 });
    }

    const data = manufacturerData.get(manufacturer)!;

    if (isTabletOrCapsule) {
      // 정제/캡슐: 원료 산정량 합계
      data.tablet += calculateRawMaterialUsage(item);
    } else {
      // 그외: 생산실적 합계
      data.other += item.production_2023_won || 0;
    }
  });

  // 지정된 개수만큼 데이터 반환
  const tabletData = Array.from(manufacturerData.entries())
    .filter(([_, data]) => data.tablet > 0)
    .sort((a, b) => b[1].tablet - a[1].tablet)
    .slice(0, limit);

  const otherData = Array.from(manufacturerData.entries())
    .filter(([_, data]) => data.other > 0)
    .sort((a, b) => b[1].other - a[1].other)
    .slice(0, limit);

  return { tabletData, otherData };
}

// 품목별 데이터 집계 (실생산처 검색 시) - 중복 제품명 제거
export function aggregateByProduct(items: DrugItem[], limit: number = 10) {
  // 제품명별로 가장 높은 생산실적을 가진 항목만 선택
  const productMap = new Map<string, DrugItem>();

  items
    .filter(item => item.production_2023_won && item.production_2023_won > 0)
    .forEach(item => {
      const existingItem = productMap.get(item.product_name);
      if (!existingItem || (item.production_2023_won || 0) > (existingItem.production_2023_won || 0)) {
        productMap.set(item.product_name, item);
      }
    });

  // Map을 배열로 변환하고 정렬
  return Array.from(productMap.values())
    .sort((a, b) => (b.production_2023_won || 0) - (a.production_2023_won || 0))
    .slice(0, limit)
    .map(item => ({
      productName: item.product_name,
      production: (item.production_2023_won || 0) / 1000000, // 백만원 단위로 변환
      ingredientName: item.ingredient_name,
      productionRaw: item.production_2023_won || 0 // 원본 값 보관
    }));
}

// 차트 색상 생성
export function generateColors(count: number) {
  const colors = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#84CC16', '#F97316', '#6366F1',
    '#14B8A6', '#F43F5E', '#A855F7', '#22D3EE', '#FACC15',
    '#DC2626', '#C026D3', '#65A30D', '#EA580C', '#4F46E5'
  ];

  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}