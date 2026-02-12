"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { CandlestickChartProps } from "./candlestick-chart";

const CandlestickChart = dynamic(
  () => import("./candlestick-chart").then((m) => ({ default: m.CandlestickChart })),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-[400px]" />,
  },
);

export function ChartWrapper(props: CandlestickChartProps) {
  return <CandlestickChart {...props} />;
}
