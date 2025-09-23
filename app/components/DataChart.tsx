'use client';

import { useEffect, useRef } from 'react';
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

interface DataChartProps {
  items: DrugItem[];
  searchType: 'ingredient' | 'manufacturer';
  searchValue: string;
}

export default function DataChart({ items, searchType, searchValue }: DataChartProps) {
  if (items.length === 0) return null;

  if (searchType === 'ingredient') {
    // 성분명 검색: 실생산처별 차트
    const { tabletData, otherData } = aggregateByManufacturer(items);

    if (tabletData.length === 0 && otherData.length === 0) return null;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📊 {searchValue} - 실생산처별 분석
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 정제/캡슐 차트 */}
          {tabletData.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-indigo-600">
                정제/캡슐 원료 사용량 (kg)
              </h4>
              <div className="h-64">
                <Bar
                  data={{
                    labels: tabletData.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name),
                    datasets: [{
                      label: '원료 사용량 (kg)',
                      data: tabletData.map(([_, data]) => data.tablet),
                      backgroundColor: generateColors(tabletData.length),
                      borderWidth: 0,
                      borderRadius: 4
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
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
                          maxRotation: 45
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* 그외 제형 차트 */}
          {otherData.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold mb-3 text-purple-600">
                그외 제형 생산실적 (원)
              </h4>
              <div className="h-64">
                <Doughnut
                  data={{
                    labels: otherData.map(([name]) => name.length > 15 ? name.substring(0, 15) + '...' : name),
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
                        position: 'bottom',
                        labels: {
                          boxWidth: 12,
                          padding: 10
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            return `${label}: ${value}`;
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (searchType === 'manufacturer') {
    // 실생산처 검색: 품목별 차트
    const productData = aggregateByProduct(items);

    if (productData.length === 0) return null;

    return (
      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          📊 {searchValue} - 주요 생산품목
        </h3>

        <div className="h-80">
          <Bar
            data={{
              labels: productData.map(item =>
                item.productName.length > 20 ?
                item.productName.substring(0, 20) + '...' :
                item.productName
              ),
              datasets: [{
                label: '생산실적 (원)',
                data: productData.map(item => item.production),
                backgroundColor: generateColors(productData.length),
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
                      return productData[index].productName;
                    },
                    afterTitle: (context) => {
                      const index = context[0].dataIndex;
                      return `성분: ${productData[index].ingredientName}`;
                    },
                    label: (context) => `생산실적: ${formatCurrency(context.parsed.y)}`
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => {
                      const num = Number(value);
                      if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B원`;
                      if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M원`;
                      if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K원`;
                      return `${num}원`;
                    }
                  }
                },
                x: {
                  ticks: {
                    maxRotation: 45
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}