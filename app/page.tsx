'use client';

import { useState, useEffect, useCallback } from 'react';

// 데이터 타입 정의
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
  // 수기 입력 필드
  manual_production?: number;
  manual_usage?: number;
}

// 샘플 데이터 (더 많은 데이터 추가)
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
  },
  {
    id: 6,
    product_code: "200808881",
    product_name: "게보린정",
    company_name: "삼진제약",
    manufacturer_name: "삼진제약",
    rx_otc: "일반",
    ingredient_name: "아세트아미노펜",
    amount: 300,
    unit: "mg",
    pack_info: "1000정/병",
    price_insurance: 8500,
    perf_production: 9500000
  },
  {
    id: 7,
    product_code: "200808882",
    product_name: "펜잘정",
    company_name: "종근당",
    manufacturer_name: "종근당",
    rx_otc: "일반",
    ingredient_name: "아세트아미노펜",
    amount: 500,
    unit: "mg",
    pack_info: "100정/병",
    price_insurance: 4200,
    perf_production: 6800000
  },
  {
    id: 8,
    product_code: "200808883",
    product_name: "비타민C정",
    company_name: "대웅제약",
    manufacturer_name: "대웅제약",
    rx_otc: "일반",
    ingredient_name: "아스코르브산",
    amount: 1000,
    unit: "mg",
    pack_info: "100정/병",
    price_insurance: 3000,
    perf_production: 4500000
  },
  {
    id: 9,
    product_code: "200808884",
    product_name: "칼슘정",
    company_name: "일동제약",
    manufacturer_name: "일동제약",
    rx_otc: "일반",
    ingredient_name: "탄산칼슘",
    amount: 500,
    unit: "mg",
    pack_info: "180정/병",
    price_insurance: 12000,
    perf_production: 7200000
  },
  {
    id: 10,
    product_code: "200808885",
    product_name: "오메가3",
    company_name: "대원제약",
    manufacturer_name: "대원제약",
    rx_otc: "일반",
    ingredient_name: "EPA/DHA",
    amount: 1000,
    unit: "mg",
    pack_info: "90캡슐/병",
    price_insurance: 25000,
    perf_production: 8900000
  }
];

// 단위 변환 함수
function unitToKg(amount: number, unit: string): number | null {
  const u = unit.trim().toLowerCase();

  // g 단위 (mg, μg 제외)
  if ((u === 'g' || u === '그램') && !u.includes('m') && !u.includes('μ')) {
    return amount / 1000;
  }

  // mg 단위
  if (u.includes('mg') || u.includes('밀리그램') || u === '㎎') {
    return amount / 1000000;
  }

  // μg/mcg 단위
  if (u.includes('μg') || u.includes('mcg') || u.includes('마이크로그램') || u === '㎍') {
    return amount / 1000000000;
  }

  // 변환 불가능한 단위 (%, IU, ml 등)
  return null;
}

// 원료 사용량 계산 함수
function calculateUsage(item: DrugItem & { manual_production?: number; manual_usage?: number }): number {
  // 수기 입력값이 있으면 우선 사용
  if (item.manual_usage !== undefined && item.manual_usage > 0) {
    return item.manual_usage;
  }

  // 자동 계산 불가능한 경우
  if (!item.price_insurance || !item.perf_production) return 0;

  const production = item.manual_production || (item.perf_production / item.price_insurance);
  const kgPerUnit = unitToKg(item.amount, item.unit);

  if (kgPerUnit === null) return 0;

  return production * kgPerUnit;
}

export default function Home() {
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [manufacturerSearch, setManufacturerSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [filteredData, setFilteredData] = useState<DrugItem[]>(sampleData);
  const [itemsData, setItemsData] = useState<Map<number, DrugItem>>(
    new Map(sampleData.map(item => [item.id, item]))
  );
  const [detailItem, setDetailItem] = useState<DrugItem | null>(null);
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // 디바운스된 검색 필터링
  useEffect(() => {
    if (searchDebounce) clearTimeout(searchDebounce);

    const timeout = setTimeout(() => {
      const filtered = sampleData.filter(item => {
        const ingredientMatch = !ingredientSearch ||
          item.ingredient_name.toLowerCase().includes(ingredientSearch.toLowerCase());
        const manufacturerMatch = !manufacturerSearch ||
          item.manufacturer_name.toLowerCase().includes(manufacturerSearch.toLowerCase());

        // 둘 다 입력되었으면 AND 조건, 하나만 입력되었으면 해당 조건만 적용
        return ingredientMatch && manufacturerMatch;
      });
      setFilteredData(filtered);
    }, 300);

    setSearchDebounce(timeout);

    return () => {
      if (searchDebounce) clearTimeout(searchDebounce);
    };
  }, [ingredientSearch, manufacturerSearch]);

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedItems.size === filteredData.length && filteredData.length > 0) {
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

  // 수기 입력값 업데이트
  const updateItemData = (id: number, updates: Partial<DrugItem>) => {
    const newData = new Map(itemsData);
    const current = newData.get(id) || sampleData.find(item => item.id === id)!;
    newData.set(id, { ...current, ...updates });
    setItemsData(newData);
  };

  // 총 원료량 계산
  const totalUsage = filteredData
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => {
      const data = itemsData.get(item.id) || item;
      return sum + calculateUsage(data);
    }, 0);

  // CSV 내보내기
  const exportCSV = () => {
    const selectedData = filteredData.filter(item => selectedItems.has(item.id));
    const csv = [
      ['품목코드', '제품명', '업체명', '실생산처', '전문/일반', '성분명', '분량', '단위', '포장정보', '보험약가', '생산실적', '원료사용량(kg)'].join(','),
      ...selectedData.map(item => {
        const data = itemsData.get(item.id) || item;
        return [
          item.product_code,
          `"${item.product_name}"`,
          `"${item.company_name}"`,
          `"${item.manufacturer_name}"`,
          item.rx_otc,
          `"${item.ingredient_name}"`,
          item.amount,
          item.unit,
          `"${item.pack_info}"`,
          item.price_insurance,
          item.perf_production,
          calculateUsage(data).toFixed(6)
        ].join(',');
      })
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-20 border-b border-blue-100">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text flex items-center gap-2">
              <span className="text-3xl">💊</span> 원료 사용량 계산기
            </h1>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              v1.0.0
            </span>
          </div>
        </div>
      </header>

      {/* 검색바 개선 */}
      <div className="p-4 bg-white/90 backdrop-blur-sm shadow-md">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <span className="inline-flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              두 검색어를 모두 입력하면 AND 조건, 하나만 입력하면 해당 조건만 적용됩니다
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-blue-600 font-medium">
                성분명
              </label>
              <input
                type="text"
                placeholder="예: 아세트아미노펜"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute left-3 top-3.5 text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>

            <div className="relative">
              <label className="absolute -top-2 left-2 bg-white px-1 text-xs text-indigo-600 font-medium">
                실생산처
              </label>
              <input
                type="text"
                placeholder="예: 한미약품"
                value={manufacturerSearch}
                onChange={(e) => setManufacturerSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-indigo-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
              <span className="absolute left-3 top-3.5 text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </span>
            </div>
          </div>

          {/* 검색 결과 통계 */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              검색 결과: <span className="font-bold text-blue-600">{filteredData.length}</span>개
            </span>
            {(ingredientSearch || manufacturerSearch) && (
              <button
                onClick={() => {
                  setIngredientSearch('');
                  setManufacturerSearch('');
                }}
                className="text-red-500 hover:text-red-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                검색 초기화
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 전체 선택 바 개선 */}
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100 flex items-center justify-between sticky top-[72px] z-10">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={selectedItems.size === filteredData.length && filteredData.length > 0}
            onChange={toggleSelectAll}
            className="w-5 h-5 rounded-md border-2 border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all"
          />
          <span className="font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
            전체 선택
          </span>
        </label>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            <span className="font-bold text-blue-600">{selectedItems.size}</span> / {filteredData.length} 선택됨
          </span>
        </div>
      </div>

      {/* 리스트 개선 */}
      <div className="px-4 py-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
              <p className="text-gray-400 text-sm mt-2">다른 검색어를 입력해주세요</p>
            </div>
          ) : (
            filteredData.map(item => {
              const data = itemsData.get(item.id) || item;
              const usage = calculateUsage(data);
              const canAutoCalculate = unitToKg(item.amount, item.unit) !== null;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border-2 ${
                    selectedItems.has(item.id) ? 'border-blue-400 bg-blue-50/50' : 'border-gray-100'
                  }`}
                >
                  {/* 카드 헤더 */}
                  <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="mt-1 w-5 h-5 rounded-md border-2 border-blue-300 text-blue-600 focus:ring-blue-500 transition-all"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 leading-tight">
                              {item.ingredient_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">{item.product_name}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            item.rx_otc === '전문' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}>
                            {item.rx_otc}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 카드 바디 */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">{item.manufacturer_name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-xs text-gray-500 block">분량</span>
                        <p className="text-sm font-bold text-gray-800">{item.amount} {item.unit}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <span className="text-xs text-gray-500 block">포장</span>
                        <p className="text-sm font-bold text-gray-800">{item.pack_info}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <span className="text-xs text-blue-600 block">보험약가</span>
                        <p className="text-sm font-bold text-blue-800">
                          {item.price_insurance.toLocaleString()}원
                        </p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-2">
                        <span className="text-xs text-indigo-600 block">생산실적</span>
                        <p className="text-sm font-bold text-indigo-800">
                          {(item.perf_production / 1000000).toFixed(1)}M원
                        </p>
                      </div>
                    </div>

                    {/* 원료량 표시 */}
                    <div className={`rounded-lg p-3 ${
                      canAutoCalculate ? 'bg-gradient-to-r from-green-50 to-emerald-50' : 'bg-yellow-50'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${
                          canAutoCalculate ? 'text-green-600' : 'text-yellow-600'
                        }`}>
                          원료 사용량 {!canAutoCalculate && '(수기입력 필요)'}
                        </span>
                        <button
                          onClick={() => setDetailItem(item)}
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors underline"
                        >
                          상세/수정
                        </button>
                      </div>
                      <p className={`text-xl font-bold mt-1 ${
                        usage > 0 ? 'text-green-700' : 'text-gray-400'
                      }`}>
                        {usage > 0 ? `${usage.toFixed(6)} kg` : '계산 불가'}
                      </p>
                      {data.manual_usage && (
                        <span className="text-xs text-orange-600 mt-1 block">수기 입력값</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 하단 합계 바 개선 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-blue-200 shadow-2xl">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                선택된 항목: <span className="font-bold text-blue-600">{selectedItems.size}</span>건
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                총 {totalUsage.toFixed(6)} kg
              </p>
            </div>

            <button
              onClick={exportCSV}
              disabled={selectedItems.size === 0}
              className={`px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 flex items-center gap-2 ${
                selectedItems.size === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV 내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {detailItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">상세 정보 / 수기 입력</h2>
                <button
                  onClick={() => setDetailItem(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">제품명</label>
                  <p className="font-medium">{detailItem.product_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">성분명</label>
                  <p className="font-medium">{detailItem.ingredient_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">제조사</label>
                  <p className="font-medium">{detailItem.manufacturer_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">분량</label>
                  <p className="font-medium">{detailItem.amount} {detailItem.unit}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">수기 입력 (선택사항)</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      생산량 (포장 수) - 자동계산: {(detailItem.perf_production / detailItem.price_insurance).toFixed(2)}
                    </label>
                    <input
                      type="number"
                      placeholder="수기로 입력하려면 여기에 입력"
                      value={itemsData.get(detailItem.id)?.manual_production || ''}
                      onChange={(e) => updateItemData(detailItem.id, {
                        manual_production: e.target.value ? Number(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">
                      원료 사용량 (kg) - 직접 입력
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder="계산 불가능한 경우 직접 입력"
                      value={itemsData.get(detailItem.id)?.manual_usage || ''}
                      onChange={(e) => updateItemData(detailItem.id, {
                        manual_usage: e.target.value ? Number(e.target.value) : undefined
                      })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    updateItemData(detailItem.id, { manual_production: undefined, manual_usage: undefined });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  초기화
                </button>
                <button
                  onClick={() => setDetailItem(null)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}