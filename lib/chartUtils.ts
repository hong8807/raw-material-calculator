import { DrugItem } from './supabase';
import { calculateRawMaterialUsage, formatNumber } from './utils';

// 실생산처별 데이터 집계 (성분명 검색 시)
export function aggregateByManufacturer(items: DrugItem[]) {
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

  // 상위 10개 데이터만 반환
  const tabletData = Array.from(manufacturerData.entries())
    .filter(([_, data]) => data.tablet > 0)
    .sort((a, b) => b[1].tablet - a[1].tablet)
    .slice(0, 10);

  const otherData = Array.from(manufacturerData.entries())
    .filter(([_, data]) => data.other > 0)
    .sort((a, b) => b[1].other - a[1].other)
    .slice(0, 10);

  return { tabletData, otherData };
}

// 품목별 데이터 집계 (실생산처 검색 시)
export function aggregateByProduct(items: DrugItem[]) {
  return items
    .filter(item => item.production_2023_won && item.production_2023_won > 0)
    .sort((a, b) => (b.production_2023_won || 0) - (a.production_2023_won || 0))
    .slice(0, 10)
    .map(item => ({
      productName: item.product_name,
      production: item.production_2023_won || 0,
      ingredientName: item.ingredient_name
    }));
}

// 차트 색상 생성
export function generateColors(count: number) {
  const colors = [
    '#3B82F6', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B',
    '#EF4444', '#EC4899', '#84CC16', '#F97316', '#6366F1'
  ];

  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
}