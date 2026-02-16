"use client";

import { useEffect, useRef } from "react";
import type { OHLCV } from "@finance/types/index.js";

interface CandlestickChartProps {
  data: OHLCV[];
  overlays?: Overlay[];
  height?: number;
  className?: string;
}

interface Overlay {
  type: "line";
  label: string;
  price: number;
  color: string;
  style?: "solid" | "dashed";
}

function CandlestickChartInner({ data, overlays, height = 400, className }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

    // Synchronously remove any previous chart instance
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    let cancelled = false;

    (async () => {
      const { createChart, ColorType, LineStyle, CandlestickSeries, HistogramSeries } =
        await import("lightweight-charts");

      if (cancelled || !containerRef.current) return;

      const chart = createChart(containerRef.current, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: "#6b7280",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(128,128,128,0.1)" },
          horzLines: { color: "rgba(128,128,128,0.1)" },
        },
        height,
        crosshair: { mode: 0 },
        timeScale: {
          borderColor: "rgba(128,128,128,0.2)",
          timeVisible: true,
        },
        rightPriceScale: {
          borderColor: "rgba(128,128,128,0.2)",
        },
      });

      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a65b",
        downColor: "#d64040",
        borderUpColor: "#26a65b",
        borderDownColor: "#d64040",
        wickUpColor: "#26a65b",
        wickDownColor: "#d64040",
      });

      // Sort ascending and deduplicate by timestamp
      const seen = new Set<number>();
      const sorted = [...data]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .filter((d) => {
          const t = new Date(d.timestamp).getTime();
          if (seen.has(t)) return false;
          seen.add(t);
          return true;
        });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const toTime = (d: OHLCV) => Math.floor(new Date(d.timestamp).getTime() / 1000) as any;

      candleSeries.setData(
        sorted.map((d) => ({
          time: toTime(d),
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })),
      );

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });

      volumeSeries.setData(
        sorted.map((d) => ({
          time: toTime(d),
          value: d.volume,
          color: d.close >= d.open ? "rgba(38,166,91,0.3)" : "rgba(214,69,65,0.3)",
        })),
      );

      if (overlays) {
        for (const overlay of overlays) {
          candleSeries.createPriceLine({
            price: overlay.price,
            color: overlay.color,
            lineWidth: 1,
            lineStyle: overlay.style === "dashed" ? LineStyle.Dashed : LineStyle.Solid,
            axisLabelVisible: true,
            title: overlay.label,
          });
        }
      }

      chart.timeScale().fitContent();
    })();

    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, overlays, height]);

  return <div ref={containerRef} style={{ height }} className={className} />;
}

// Export with dynamic import wrapper
export { CandlestickChartInner as CandlestickChart };
export type { CandlestickChartProps, Overlay };
