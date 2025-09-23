'use client';

import { useState, useEffect } from 'react';

// 샘플 데이터 타입
interface DrugItem {
  id: number;
  product_code: string;
  product_name: string;
  company_name: string;
  manufacturer_name: string;
  rx_otc: string;
  ingredient_name: string;
  amount: number;
  unit: string;
  pack_info: string;
  price_insurance: number;
  perf_production: number;
}

// 샘플 데이터
const sampleData: DrugItem[] = [
  {
    id: 1,
    product_code: "200808876",
    product_name: "한미탐스플러스정",
    company_name: "한미약품(주)",
    manufacturer_name: "한미약품(주)",
    rx_otc: "일반",
    ingredient_name: "탄산수소나트륨",
    amount: 520,
    unit: "mg",
    pack_info: "500정/병",
    price_insurance: 11000,
    perf_production: 5500000
  },
  {
    id: 2,
    product_code: "200808877",
    product_name: "타이레놀정500mg",
    company_name: "한국얀센",
    manufacturer_name: "녹십자",
    rx_otc: "일반",
    ingredient_name: "아세트아미노펜",
    amount: 500,
    unit: "mg",
    pack_info: "10정/PTP",
    price_insurance: 1200,
    perf_production: 12000000
  },
  {
    id: 3,
    product_code: "200808878",
    product_name: "부루펜정",
    company_name: "삼일제약",
    manufacturer_name: "삼일제약",
    rx_otc: "일반",
    ingredient_name: "이부프로펜",
    amount: 400,
    unit: "mg",
    pack_info: "100정/병",
    price_insurance: 5000,
    perf_production: 8000000
  },
  {
    id: 4,
    product_code: "200808879",
    product_name: "아스피린정100mg",
    company_name: "바이엘코리아",
    manufacturer_name: "바이엘코리아",
    rx_otc: "전문",
    ingredient_name: "아스피린",
    amount: 100,
    unit: "mg",
    pack_info: "30정/PTP",
    price_insurance: 2500,
    perf_production: 15000000
  },
  {
    id: 5,
    product_code: "200808880",
    product_name: "판콜에이내복액",
    company_name: "동화약품",
    manufacturer_name: "동화약품",
    rx_otc: "일반",
    ingredient_name: "아세트아미노펜",
    amount: 32,
    unit: "mg/ml",
    pack_info: "100ml/병",
    price_insurance: 3500,
    perf_production: 7000000
  }
];

// 단위 변환 함수
function unitToKg(amount: number, unit: string): number {
  const u = unit.trim().toLowerCase();
  if (u.includes('g') && !u.includes('mg') && !u.includes('μg')) {
    return amount / 1000;
  }
  if (u.includes('mg') || u.includes('밀리그램')) {
    return amount / 1000000;
  }
  if (u.includes('μg') || u.includes('mcg') || u.includes('마이크로그램')) {
    return amount / 1000000000;
  }
  return 0; // 변환 불가
}

// 원료 사용량 계산 함수
function calculateUsage(item: DrugItem): number {
  if (!item.price_insurance || !item.perf_production) return 0;

  const production = item.perf_production / item.price_insurance;
  const kgPerUnit = unitToKg(item.amount, item.unit);

  return production * kgPerUnit;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'ingredient' | 'manufacturer'>('ingredient');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [filteredData, setFilteredData] = useState<DrugItem[]>(sampleData);

  // 검색 필터링
  useEffect(() => {
    const filtered = sampleData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      if (searchType === 'ingredient') {
        return item.ingredient_name.toLowerCase().includes(searchLower);
      } else {
        return item.manufacturer_name.toLowerCase().includes(searchLower);
      }
    });
    setFilteredData(filtered);
  }, [searchTerm, searchType]);

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredData.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredData.map(item => item.id)));
    }
  };

  // 개별 선택
  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  // 총 원료량 계산
  const totalUsage = filteredData
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + calculateUsage(item), 0);

  // CSV 내보내기
  const exportCSV = () => {
    const selectedData = filteredData.filter(item => selectedItems.has(item.id));
    const csv = [
      ['제품명', '성분명', '제조사', '보험약가', '생산실적', '원료사용량(kg)'].join(','),
      ...selectedData.map(item => [
        item.product_name,
        item.ingredient_name,
        item.manufacturer_name,
        item.price_insurance,
        item.perf_production,
        calculateUsage(item).toFixed(3)
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `원료사용량_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            📊 원료 사용량 계산기
          </h1>
        </div>
      </header>

      {/* 검색바 */}
      <div className="p-4 bg-white border-b">
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setSearchType('ingredient')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'ingredient'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            성분명
          </button>
          <button
            onClick={() => setSearchType('manufacturer')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              searchType === 'manufacturer'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            실생산처
          </button>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder={`${searchType === 'ingredient' ? '성분명' : '실생산처'} 검색...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 전체 선택 */}
      <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectedItems.size === filteredData.length && filteredData.length > 0}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-sm font-medium">전체 선택</span>
        </label>
        <span className="text-sm text-gray-500">
          {filteredData.length}개 항목
        </span>
      </div>

      {/* 리스트 */}
      <div className="px-4 py-2">
        {filteredData.map(item => {
          const usage = calculateUsage(item);
          return (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm mb-3 p-4 border border-gray-200"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedItems.has(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.ingredient_name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.product_name}</p>
                  <p className="text-xs text-gray-400 mt-1">{item.manufacturer_name}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div>
                      <span className="text-xs text-gray-500">분량</span>
                      <p className="text-sm font-medium">{item.amount} {item.unit}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">원료량</span>
                      <p className="text-sm font-medium text-blue-600">
                        {usage > 0 ? `${usage.toFixed(3)} kg` : '계산불가'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 하단 합계 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">선택 {selectedItems.size}건</p>
            <p className="text-lg font-bold text-blue-600">
              총 {totalUsage.toFixed(3)} kg
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={selectedItems.size === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            📥 CSV 내보내기
          </button>
        </div>
      </div>
    </div>
  );
}
