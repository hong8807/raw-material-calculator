'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DrugItem } from '@/lib/supabase';
import { aggregateByManufacturer, aggregateByProduct, generateColors } from '@/lib/chartUtils';
import { formatNumber, formatCurrency } from '@/lib/utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: DrugItem[];
  searchType: 'ingredient' | 'manufacturer';
  searchValue: string;
}

export default function ChartModal({
  isOpen,
  onClose,
  items,
  searchType,
  searchValue
}: ChartModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (searchType === 'ingredient') {
    // 성분명 검색: 실생산처별 차트 (상위 20개)
    const { tabletData, otherData } = aggregateByManufacturer(items, 20);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 {searchValue} - 실생산처별 상세 분석
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* 정제/캡슐 차트 */}
              {tabletData.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-indigo-700">
                    💊 정제/캡슐 원료 사용량 상위 {tabletData.length}개 업체 (kg)
                  </h3>
                  <div className="h-[500px]">
                    <Bar
                      data={{
                        labels: tabletData.map(([name]) =>
                          name.length > 20 ? name.substring(0, 20) + '...' : name
                        ),
                        datasets: [{
                          label: '원료 사용량 (kg)',
                          data: tabletData.map(([_, data]) => data.tablet),
                          backgroundColor: generateColors(tabletData.length),
                          borderWidth: 0,
                          borderRadius: 6
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            callbacks: {
                              title: (context) => {
                                const index = context[0].dataIndex;
                                return tabletData[index][0];
                              },
                              label: (context) => `${formatNumber(context.parsed.y, 3)} kg`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `${formatNumber(Number(value), 1)}kg`
                            }
                          },
                          x: {
                            ticks: {
                              maxRotation: 45,
                              minRotation: 45
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>총 {tabletData.length}개 업체 표시</p>
                    <p>총 원료 사용량: {formatNumber(
                      tabletData.reduce((sum, [_, data]) => sum + data.tablet, 0), 2
                    )} kg</p>
                  </div>
                </div>
              )}

              {/* 그외 제형 차트 */}
              {otherData.length > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4 text-purple-700">
                    💉 그외 제형 생산실적 상위 {otherData.length}개 업체 (원)
                  </h3>
                  <div className="h-[500px]">
                    <Doughnut
                      data={{
                        labels: otherData.map(([name]) =>
                          name.length > 20 ? name.substring(0, 20) + '...' : name
                        ),
                        datasets: [{
                          data: otherData.map(([_, data]) => data.other),
                          backgroundColor: generateColors(otherData.length),
                          borderWidth: 2,
                          borderColor: '#ffffff'
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              boxWidth: 15,
                              padding: 10,
                              font: { size: 11 }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: (context) => {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const percentage = ((context.parsed / context.dataset.data.reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1);
                                return [`${label}`, `${value} (${percentage}%)`];
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-4 text-sm text-gray-600">
                    <p>총 {otherData.length}개 업체 표시</p>
                    <p>총 생산실적: {formatCurrency(
                      otherData.reduce((sum, [_, data]) => sum + data.other, 0)
                    )}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (searchType === 'manufacturer') {
    // 실생산처 검색: 품목별 차트 (상위 20개)
    const productData = aggregateByProduct(items, 20);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 {searchValue} - 주요 생산품목 상세 분석
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-emerald-700">
                🏭 생산실적 상위 {productData.length}개 품목
              </h3>
              <div className="h-[600px]">
                <Bar
                  data={{
                    labels: productData.map(item =>
                      item.productName.length > 30 ?
                      item.productName.substring(0, 30) + '...' :
                      item.productName
                    ),
                    datasets: [{
                      label: '생산실적 (백만원)',
                      data: productData.map(item => item.production),
                      backgroundColor: generateColors(productData.length),
                      borderWidth: 0,
                      borderRadius: 8
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // 가로 막대 그래프
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          title: (context) => {
                            const index = context[0].dataIndex;
                            return productData[index].productName;
                          },
                          afterTitle: (context) => {
                            const index = context[0].dataIndex;
                            return `성분: ${productData[index].ingredientName}`;
                          },
                          label: (context) => `생산실적: ${formatNumber(context.parsed.x, 1)}백만원`
                        }
                      }
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: '생산실적 (백만원)'
                        },
                        ticks: {
                          callback: (value) => `${formatNumber(Number(value), 0)}M`
                        }
                      },
                      y: {
                        ticks: {
                          font: { size: 10 }
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* 품목 상세 정보 테이블 */}
              <div className="mt-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-700">상위 10개 품목 상세</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">순위</th>
                        <th className="px-3 py-2 text-left">제품명</th>
                        <th className="px-3 py-2 text-left">성분명</th>
                        <th className="px-3 py-2 text-right">생산실적 (백만원)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {productData.slice(0, 10).map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-center">{index + 1}</td>
                          <td className="px-3 py-2">
                            <span className="text-xs">
                              {item.productName.length > 40
                                ? item.productName.substring(0, 40) + '...'
                                : item.productName}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-gray-600">
                            {item.ingredientName}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {formatNumber(item.production, 1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <p>총 {productData.length}개 품목 분석</p>
                  <p>총 생산실적: {formatNumber(
                    productData.reduce((sum, item) => sum + item.production, 0), 1
                  )}백만원</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}