"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader, EmptySlot } from "./DashboardBase";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface DonutCardProps {
  stats: { total: number };
  donutS: number[];
}

export default function DonutCard({ stats, donutS }: DonutCardProps) {
  const donutOpts: ApexCharts.ApexOptions = {
    chart: { type: "donut", background: "transparent", fontFamily: "inherit" },
    colors: ["#2EB67D", "#36C5F0", "#ECB22E", "#E5E7EB"],
    labels: ["Done", "In Progress", "Review", "To Do"],
    dataLabels: { enabled: false }, legend: { show: false },
    plotOptions: { pie: { donut: { size: "68%", labels: { show: true, total: { show: true, label: "Total", fontSize: "11px", fontWeight: "700", color: "#9CA3AF", formatter: () => stats.total.toString() } } } } },
    stroke: { width: 0 }, tooltip: { theme: "light" },
  };

  return (
    <Card>
      <CardHeader title="Status breakdown" sub="Task distribution" />
      <div className="flex-1 px-4 pb-2 pt-2 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0">
          {stats.total > 0
            ? <Chart options={donutOpts} series={donutS} type="donut" height="100%" />
            : <EmptySlot msg="Add tasks to see the status breakdown." />
          }
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-2 flex-shrink-0">
          {[
            ["Done", donutS[0], "#2EB67D"],
            ["Active", donutS[1], "#36C5F0"],
            ["Review", donutS[2], "#ECB22E"],
            ["To Do", donutS[3], "#D1D5DB"]
          ].map(([l, n, c]) => (
            <div key={l as string} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-[#F9F9F7]">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: c as string }} />
              <span className="text-[10px] font-semibold text-[#6B7280] flex-1 truncate">{l as string}</span>
              <span className="text-[11px] font-black text-[#0D0D0D]">{n as number}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
