'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DrugItem, searchDrugs } from '@/lib/supabase';
import { calculateRawMaterialUsage, formatNumber, formatCurrency, formatProduction, formatProductionShort, exportToCSV } from '@/lib/utils';
import DataChart from './components/DataChart';
import ChartModal from './components/ChartModal';
import ScrollToTop from './components/ScrollToTop';
import AutoComplete from './components/AutoComplete';

export default function Home() {
  const [items, setItems] = useState<DrugItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DrugItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [selectedItem, setSelectedItem] = useState<DrugItem | null>(null);

  // 검색 필터
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [manufacturerFilter, setManufacturerFilter] = useState('');

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50; // 한 페이지당 50개 아이템

  // 차트 표시 조건 계산
  const getChartType = (): { type: 'ingredient' | 'manufacturer' | null; value: string } => {
    const hasIngredient = ingredientFilter.trim().length > 0;
    const hasManufacturer = manufacturerFilter.trim().length > 0;

    if (hasIngredient && !hasManufacturer) {
      return { type: 'ingredient', value: ingredientFilter.trim() };
    }
    if (!hasIngredient && hasManufacturer) {
      return { type: 'manufacturer', value: manufacturerFilter.trim() };
    }
    return { type: null, value: '' };
  };

  const chartInfo = getChartType();

  // 로딩 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [showAllManufacturers, setShowAllManufacturers] = useState(false);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage, itemsPerPage]);

  // 유니크한 성분명 리스트 생성
  const uniqueIngredients = useMemo(() => {
    const ingredients = new Set<string>();
    items.forEach(item => {
      if (item.ingredient_name) {
        ingredients.add(item.ingredient_name);
      }
    });
    return Array.from(ingredients).sort();
  }, [items]);

  // 유니크한 제조사 리스트 생성
  const uniqueManufacturers = useMemo(() => {
    const manufacturers = new Set<string>();
    items.forEach(item => {
      if (item.manufacturer_name) {
        manufacturers.add(item.manufacturer_name);
      }
    });
    return Array.from(manufacturers).sort();
  }, [items]);

  // Supabase에서 데이터 가져오기
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await searchDrugs();
      const itemsWithId = data.map(item => ({
        ...item,
        id: item.id
      }));
      setItems(itemsWithId);
      setFilteredItems(itemsWithId);
    } catch (err) {
      console.error('데이터 로드 오류:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 검색 필터링
  const handleSearch = useCallback(async () => {
    if (!ingredientFilter && !manufacturerFilter) {
      setFilteredItems(items);
      return;
    }

    setLoading(true);
    try {
      const data = await searchDrugs(ingredientFilter, manufacturerFilter);
      const itemsWithId = data.map(item => ({
        ...item,
        id: item.id
      }));
      setFilteredItems(itemsWithId);
      setCurrentPage(1); // 검색 시 첫 페이지로 이동
      setShowAllManufacturers(false); // 검색 변경 시 목록 접기
    } catch (err) {
      console.error('검색 오류:', err);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [ingredientFilter, manufacturerFilter, items]);

  // 필터 변경 시 자동 검색 (디바운싱)
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [ingredientFilter, manufacturerFilter, handleSearch]);

  // 체크박스 토글
  const toggleCheck = (id: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  // 현재 페이지 전체 선택/해제
  const toggleAllChecks = () => {
    const currentPageIds = new Set(paginatedItems.map(item => item.id));
    const allCurrentPageChecked = paginatedItems.every(item => checkedItems.has(item.id));

    if (allCurrentPageChecked) {
      // 현재 페이지 아이템들만 체크 해제
      const newChecked = new Set(checkedItems);
      currentPageIds.forEach(id => newChecked.delete(id));
      setCheckedItems(newChecked);
    } else {
      // 현재 페이지 아이템들 체크
      const newChecked = new Set(checkedItems);
      currentPageIds.forEach(id => newChecked.add(id));
      setCheckedItems(newChecked);
    }
  };

  // 상세 보기
  const openDetail = (item: DrugItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };


  // 선택된 항목들
  const selectedItems = filteredItems.filter(item => checkedItems.has(item.id));

  // 총 원료 사용량 계산
  const totalUsage = selectedItems.reduce((sum, item) =>
    sum + calculateRawMaterialUsage(item), 0
  );

  // 성분명 검색 시 실생산처별 생산실적 계산
  const manufacturersByProduction = useMemo(() => {
    if (!ingredientFilter || manufacturerFilter) return [];

    const manufacturerMap = new Map<string, number>();
    filteredItems.forEach(item => {
      if (item.manufacturer_name && item.production_2023_won) {
        const current = manufacturerMap.get(item.manufacturer_name) || 0;
        manufacturerMap.set(item.manufacturer_name, current + item.production_2023_won);
      }
    });

    return Array.from(manufacturerMap.entries())
      .map(([name, production]) => ({ name, production }))
      .sort((a, b) => b.production - a.production); // 모든 업체 포함
  }, [filteredItems, ingredientFilter, manufacturerFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white/90 backdrop-blur-sm shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                원료 사용량 산정 계산기
              </h1>
              <p className="text-sm text-gray-700 font-medium mt-1">의약품 원료 사용량 계산 시스템</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-700 font-medium">데이터 수</div>
              <div className="text-lg font-bold text-indigo-600">
                {formatNumber(filteredItems.length, 0)} / {formatNumber(items.length, 0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 검색 필터 */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AutoComplete
              label="성분명 검색"
              placeholder="예: 아세트아미노펜"
              value={ingredientFilter}
              onChange={setIngredientFilter}
              suggestions={uniqueIngredients}
            />
            <div>
              <AutoComplete
                label="실생산처 검색"
                placeholder="예: 한미약품"
                value={manufacturerFilter}
                onChange={setManufacturerFilter}
                suggestions={uniqueManufacturers}
              />
              {manufacturerFilter && ingredientFilter && (
                <button
                  onClick={() => {
                    setManufacturerFilter('');
                    setCurrentPage(1);
                  }}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  × 실생산처 필터 해제
                </button>
              )}
            </div>
          </div>

          {/* 성분명 검색 시 실생산처 목록 표시 */}
          {manufacturersByProduction.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  실생산처별 생산실적 (총 {manufacturersByProduction.length}개 업체)
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 font-medium">
                    합계: {formatProduction(manufacturersByProduction.reduce((sum, item) => sum + item.production, 0))}
                  </span>
                  {manufacturersByProduction.length > 20 && (
                    <button
                      onClick={() => setShowAllManufacturers(!showAllManufacturers)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      {showAllManufacturers ? '접기 ▲' : `전체 보기 (${manufacturersByProduction.length}개) ▼`}
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {(showAllManufacturers ? manufacturersByProduction : manufacturersByProduction.slice(0, 20)).map((item, index) => {
                  // 회사명 길이에 따른 글자 크기 조정
                  const nameLength = item.name.length;
                  let textSizeClass = 'text-sm';
                  if (nameLength > 12) textSizeClass = 'text-xs';
                  if (nameLength > 16) textSizeClass = 'text-[11px]';
                  if (nameLength > 20) textSizeClass = 'text-[10px]';

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setManufacturerFilter(item.name);
                        setCurrentPage(1);
                      }}
                      className={`text-left p-2 h-[72px] rounded-lg transition-colors border flex flex-col justify-between ${
                        manufacturerFilter === item.name
                          ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-300'
                          : 'bg-gray-50 hover:bg-indigo-50 border-gray-200 hover:border-indigo-300'
                      }`}
                      title={`${item.name}\n생산실적: ${formatProduction(item.production)}`}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-semibold text-gray-700">#{index + 1}</span>
                        <span className="text-[10px] text-indigo-600 font-medium whitespace-nowrap">
                          {formatProductionShort(item.production)}
                        </span>
                      </div>
                      <div className={`font-medium text-gray-800 leading-tight break-keep ${textSizeClass}`}>
                        {item.name}
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-gray-700 font-medium">
                * 클릭하면 해당 실생산처로 필터링됩니다
                {!showAllManufacturers && manufacturersByProduction.length > 20 &&
                  ` (상위 20개 표시 중)`
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 로딩/에러 표시 */}
      {loading && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-700">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* 전체 선택 바 */}
      <div className="container mx-auto px-4 mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md px-6 py-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                checked={paginatedItems.length > 0 && paginatedItems.every(item => checkedItems.has(item.id))}
                onChange={toggleAllChecks}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-gray-700 font-medium">
                현재 페이지 선택
              </span>
              <span className="text-sm text-gray-700 font-medium">
                ({checkedItems.size}개 선택됨 / 전체 {filteredItems.length}개)
              </span>
              {checkedItems.size === filteredItems.length && filteredItems.length > 0 && (
                <span className="text-sm font-semibold text-green-600">
                  ✓ 전체 선택됨
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // 전체 검색 결과 선택
                  setCheckedItems(new Set(filteredItems.map(item => item.id)));
                }}
                disabled={checkedItems.size === filteredItems.length && filteredItems.length > 0}
                className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                  checkedItems.size === filteredItems.length && filteredItems.length > 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                전체 {filteredItems.length}개 모두 선택
              </button>
              <button
                onClick={() => {
                  // 전체 선택 해제
                  setCheckedItems(new Set());
                }}
                disabled={checkedItems.size === 0}
                className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                  checkedItems.size === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                선택 해제
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 차트 표시 */}
      {chartInfo.type && filteredItems.length > 0 && (
        <div className="container mx-auto px-4">
          <DataChart
            items={filteredItems}
            searchType={chartInfo.type}
            searchValue={chartInfo.value}
            onExpand={() => setIsChartModalOpen(true)}
          />
        </div>
      )}

      {/* 데이터 리스트 */}
      <div className="container mx-auto px-4 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((item) => {
            const usage = calculateRawMaterialUsage(item);
            const isCalculable = item.price_insurance && item.production_2023_won;

            return (
              <div
                key={item.id}
                className={`bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 transition-all hover:shadow-2xl hover:scale-[1.02] ${
                  checkedItems.has(item.id) ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <input
                    type="checkbox"
                    checked={checkedItems.has(item.id)}
                    onChange={() => toggleCheck(item.id)}
                    className="w-5 h-5 mt-1 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-lg text-gray-800 leading-tight truncate">
                      {item.ingredient_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium mt-1 truncate" title={item.product_name}>{item.product_name}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-xs sm:text-sm">판매사</span>
                    <span className="font-medium text-xs sm:text-sm truncate max-w-[60%]" title={item.company_name}>{item.company_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-xs sm:text-sm">생산처</span>
                    <span className="font-medium text-xs sm:text-sm truncate max-w-[60%]" title={item.manufacturer_name}>{item.manufacturer_name}</span>
                  </div>
                  {item.standard && (
                    <div className="flex justify-between">
                      <span className="text-gray-700 text-xs sm:text-sm">규격</span>
                      <span className="font-medium text-xs sm:text-sm truncate max-w-[60%]" title={item.standard}>{item.standard}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-xs sm:text-sm">분량</span>
                    <span className="font-medium text-xs sm:text-sm">{item.amount} {item.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-xs sm:text-sm">보험약가</span>
                    <span className="font-medium text-xs sm:text-sm">
                      {item.price_insurance ? formatCurrency(item.price_insurance) : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 text-xs sm:text-sm">생산실적</span>
                    <span className="font-medium text-xs sm:text-sm">
                      {formatProduction(item.production_2023_won)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="text-xs text-gray-700">원료 사용량</div>
                      <div className={`text-lg font-bold ${usage > 0 ? 'text-indigo-600' : 'text-gray-600'}`}>
                        {usage > 0 ? `${formatNumber(usage, 3)} kg` :
                         !isCalculable ? '계산 불가' : '0 kg'}
                      </div>
                      {item.appearance_info && item.appearance_info.includes('그외') && (
                        <div className="text-xs text-orange-500 mt-1">
                          ⚠️ 원료산정 주의
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {item.product_code && (
                        <a
                          href={`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetailCache?cacheSeq=${item.product_code}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          title="의약품안전나라에서 보기"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/>
                            <line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => openDetail(item)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                      >
                        상세
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-700 font-medium">
              전체 {filteredItems.length}개 중 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)}개 표시
            </div>
            <div className="flex items-center gap-2">
              {/* 이전 페이지 */}
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.max(1, prev - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                이전
              </button>

              {/* 페이지 번호 */}
              <div className="flex items-center gap-1">
                {currentPage > 2 && (
                  <>
                    <button
                      onClick={() => {
                        setCurrentPage(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shadow-md transition"
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className="px-2 text-gray-600 font-medium">...</span>}
                  </>
                )}

                {currentPage > 1 && (
                  <button
                    onClick={() => {
                      setCurrentPage(currentPage - 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shadow-md transition"
                  >
                    {currentPage - 1}
                  </button>
                )}

                <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white shadow-md">
                  {currentPage}
                </button>

                {currentPage < totalPages && (
                  <button
                    onClick={() => {
                      setCurrentPage(currentPage + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shadow-md transition"
                  >
                    {currentPage + 1}
                  </button>
                )}

                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="px-2 text-gray-600 font-medium">...</span>}
                    <button
                      onClick={() => {
                        setCurrentPage(totalPages);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 shadow-md transition"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* 다음 페이지 */}
              <button
                onClick={() => {
                  setCurrentPage(prev => Math.min(totalPages, prev + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg transition ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
                }`}
              >
                다음
              </button>

              {/* 페이지 직접 입력 */}
              <div className="flex items-center gap-2 ml-4">
                <span className="text-sm text-gray-700 font-medium">페이지</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= totalPages) {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="w-16 px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-700 font-medium">/ {totalPages}</span>
              </div>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-700 font-medium text-lg">검색 결과가 없습니다.</p>
          </div>
        )}
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-2xl border-t border-gray-200">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-6">
              <div>
                <div className="text-xs text-gray-700 font-medium">선택</div>
                <div className="text-sm sm:text-lg font-bold">{selectedItems.length}개</div>
              </div>
              <div>
                <div className="text-xs text-gray-700 font-medium">총 원료량</div>
                <div className="text-base sm:text-xl font-bold text-indigo-600">
                  {formatNumber(totalUsage, 3)} kg
                </div>
              </div>
            </div>
            <button
              onClick={() => selectedItems.length > 0 && exportToCSV(selectedItems)}
              disabled={selectedItems.length === 0}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition ${
                selectedItems.length > 0
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              CSV 내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 상세 모달 */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">상세 정보</h2>
                <div className="flex items-center gap-2">
                  {selectedItem.product_code && (
                    <a
                      href={`https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetailCache?cacheSeq=${selectedItem.product_code}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                      title="의약품안전나라에서 보기"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-600 hover:text-gray-800 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {/* 기본 정보 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-3 text-indigo-600">
                    {selectedItem.ingredient_name}
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-700 font-medium">제품명:</span>
                      <p className="font-medium text-gray-900">{selectedItem.product_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">품목코드:</span>
                      <p className="font-medium text-gray-900">{selectedItem.product_code}</p>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">판매사:</span>
                      <p className="font-medium text-gray-900">{selectedItem.company_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">생산처:</span>
                      <p className="font-medium text-gray-900">{selectedItem.manufacturer_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">전문/일반:</span>
                      <p className="font-medium text-gray-900">{selectedItem.rx_otc || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">분량/단위:</span>
                      <p className="font-medium text-gray-900">{selectedItem.amount} {selectedItem.unit}</p>
                    </div>
                    {selectedItem.standard && (
                      <div className="col-span-2">
                        <span className="text-gray-700 font-medium">규격:</span>
                        <p className="font-medium text-gray-900">{selectedItem.standard}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 생산/가격 정보 */}
                <div className="bg-blue-50 rounded-xl p-4">
                  <h4 className="font-bold mb-3 text-blue-700">생산/가격 정보</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-700 block font-medium">보험약가:</span>
                      <p className="font-bold text-base sm:text-lg text-gray-900 truncate" title={selectedItem.price_insurance ? formatCurrency(selectedItem.price_insurance) : '-'}>
                        {selectedItem.price_insurance ? formatCurrency(selectedItem.price_insurance) : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-700 block font-medium">생산실적 (2023):</span>
                      <p className="font-bold text-base sm:text-lg text-gray-900 truncate" title={formatProduction(selectedItem.production_2023_won)}>
                        {formatProduction(selectedItem.production_2023_won)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 추가 상세 정보 */}
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-bold mb-3 text-purple-700">추가 정보</h4>
                  <div className="space-y-2 text-sm">
                    {selectedItem.pack_info && (
                      <div>
                        <span className="text-gray-700 font-medium">포장정보:</span>
                        <p className="font-medium text-gray-900">{selectedItem.pack_info}</p>
                      </div>
                    )}
                    {selectedItem.appearance_info && (
                      <div>
                        <span className="text-gray-700 font-medium">성상정보:</span>
                        <p className="font-medium text-gray-900">{selectedItem.appearance_info}</p>
                      </div>
                    )}
                    {selectedItem.storage_method && (
                      <div>
                        <span className="text-gray-700 font-medium">저장방법:</span>
                        <p className="font-medium text-gray-900">{selectedItem.storage_method}</p>
                      </div>
                    )}
                    {selectedItem.usage_period && (
                      <div>
                        <span className="text-gray-700 font-medium">사용기간:</span>
                        <p className="font-medium text-gray-900">{selectedItem.usage_period}</p>
                      </div>
                    )}
                    {selectedItem.atc_code && (
                      <div>
                        <span className="text-gray-700 font-medium">ATC 코드:</span>
                        <p className="font-medium text-gray-900">{selectedItem.atc_code}</p>
                      </div>
                    )}
                    {selectedItem.permit_date && (
                      <div>
                        <span className="text-gray-700 font-medium">허가일자:</span>
                        <p className="font-medium text-gray-900">{selectedItem.permit_date}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 계산 결과 */}
                <div className="bg-green-50 rounded-xl p-4">
                  <h4 className="font-bold mb-2 text-green-700">계산 결과</h4>
                  <div className="text-2xl font-bold text-green-600">
                    원료 사용량: {formatNumber(calculateRawMaterialUsage(selectedItem), 3)} kg
                  </div>
                  {selectedItem.appearance_info && selectedItem.appearance_info.includes('그외') && (
                    <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-orange-600">⚠️</span>
                        <div className="text-sm text-orange-700">
                          <strong>원료산정 주의</strong><br />
                          정제/캡슐이 아닌 제형(그외)은 원료량 산정이 정확하지 않을 수 있습니다.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 차트 확대 모달 */}
      {chartInfo.type && (
        <ChartModal
          isOpen={isChartModalOpen}
          onClose={() => setIsChartModalOpen(false)}
          items={filteredItems}
          searchType={chartInfo.type}
          searchValue={chartInfo.value}
        />
      )}

      {/* 맨 위로 버튼 */}
      <ScrollToTop />
    </div>
  );
}