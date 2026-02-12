"use client";

import { useEffect, useRef, useCallback } from "react";
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
  const chartRef = useRef<ReturnType<typeof import("lightweight-charts").createChart> | null>(null);

  const initChart = useCallback(async () => {
    if (!containerRef.current || data.length === 0) return;

    const { createChart, ColorType, LineStyle } = await import("lightweight-charts");

    // Dispose previous
    if (chartRef.current) {
      chartRef.current.remove();
    }

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "var(--color-terminal-400)",
        fontFamily: "JetBrains Mono, monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(128,128,128,0.1)" },
        horzLines: { color: "rgba(128,128,128,0.1)" },
      },
      width: containerRef.current.clientWidth,
      height,
      crosshair: {
        mode: 0, // Normal
      },
      timeScale: {
        borderColor: "rgba(128,128,128,0.2)",
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: "rgba(128,128,128,0.2)",
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "oklch(0.72 0.19 145)",
      downColor: "oklch(0.65 0.2 25)",
      borderUpColor: "oklch(0.72 0.19 145)",
      borderDownColor: "oklch(0.65 0.2 25)",
      wickUpColor: "oklch(0.72 0.19 145)",
      wickDownColor: "oklch(0.65 0.2 25)",
    });

    const chartData = data.map((d) => ({
      time: (d.timestamp instanceof Date ? d.timestamp.getTime() / 1000 : new Date(d.timestamp).getTime() / 1000) as import("lightweight-charts").UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candleSeries.setData(chartData);

    // Volume
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      data.map((d) => ({
        time: (d.timestamp instanceof Date ? d.timestamp.getTime() / 1000 : new Date(d.timestamp).getTime() / 1000) as import("lightweight-charts").UTCTimestamp,
        value: d.volume,
        color: d.close >= d.open ? "rgba(38,166,91,0.3)" : "rgba(214,69,65,0.3)",
      })),
    );

    // Overlays (price lines)
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

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [data, overlays, height]);

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.then((fn) => fn?.());
    };
  }, [initChart]);

  return <div ref={containerRef} className={className} />;
}

// Export with dynamic import wrapper
export { CandlestickChartInner as CandlestickChart };
export type { CandlestickChartProps, Overlay };
