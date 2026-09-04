import React, { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  ColorType,
  type IChartApi,
  type ISeriesApi
} from 'lightweight-charts';

interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface PriceChartProps {
  data: ChartData[];
  textColor?: string;
  backgroundColor?: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  textColor = '#94a3b8',
  backgroundColor = '#0b0f17'
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const initialWidth = container.clientWidth || 600;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: backgroundColor },
        textColor,
      },
      width: initialWidth,
      height: 400,
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      }
    });
    chartRef.current = chart;

    // Use modern lightweight-charts v5 addSeries API
    const series = chart.addSeries(CandlestickSeries, {
      upColor: '#10b981', // Emerald 500
      downColor: '#ef4444', // Red 500
      borderVisible: false,
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    });
    candlestickSeriesRef.current = series;

    if (data && data.length > 0) {
      try {
        // Validate and ensure ascending sort by time with no duplicates (required by lightweight-charts)
        const sorted = [...data]
          .filter((d) => d && d.time && typeof d.open === 'number' && !isNaN(d.open))
          .sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0));

        const deduplicated = sorted.filter((item, idx, arr) =>
          idx === arr.findIndex((t) => t.time === item.time)
        );

        if (deduplicated.length > 0) {
          // @ts-ignore
          series.setData(deduplicated);
          chart.timeScale().fitContent();
        }
      } catch (err) {
        console.error("Error setting chart data:", err);
      }
    }

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries[0] && chartRef.current && container) {
        const newWidth = entries[0].contentRect.width || container.clientWidth;
        if (newWidth > 0) {
          chartRef.current.applyOptions({ width: newWidth });
        }
      }
    });
    resizeObserver.observe(container);

    const handleResize = () => {
      if (container && chartRef.current) {
        chartRef.current.applyOptions({ width: container.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
      candlestickSeriesRef.current = null;
    };
  }, [data, backgroundColor, textColor]);

  return (
    <div
      ref={chartContainerRef}
      className="w-full relative shadow-md border border-slate-800 rounded-xl overflow-hidden bg-slate-950 min-h-[400px]"
    />
  );
};

export default PriceChart;