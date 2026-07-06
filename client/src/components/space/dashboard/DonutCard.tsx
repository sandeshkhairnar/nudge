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
    chart: { type: "donut", background: "transparent", fontFamily: "inherit", animations: { enabled: true, speed: 1000 } },
    colors: ["#2EB67D", "#36C5F0", "#ECB22E", "rgba(0,0,0,0.05)"],
    labels: ["Done", "Active", "Review", "To Do"],
    dataLabels: { enabled: false }, 
    legend: { show: false },
    plotOptions: { 
      pie: { 
        donut: { 
          size: "75%", 
          labels: { 
            show: true, 
            total: { 
              show: true, 
              label: "TOTAL", 
              fontSize: "10px", 
              fontWeight: "600", 
              color: "#9CA3AF", 
              formatter: () => stats.total.toString() 
            },
            value: {
              fontSize: "24px",
              fontWeight: "700",
              color: "#111827",
              offsetY: 2
            }
          } 
        } 
      } 
    },
    stroke: { width: 0 }, 
    tooltip: { theme: "light", style: { fontSize: "11px", fontFamily: "inherit" } },
    states: { hover: { filter: { type: "none" } } }
  };

  return (
    <Card>
      <CardHeader 
        title="Status Breakdown" 
        sub="Current distribution" 
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      />
      <div className="flex-1 px-5 pb-6 pt-2 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 relative">
          {stats.total > 0
            ? <Chart options={donutOpts} series={donutS} type="donut" height="100%" />
            : <EmptySlot msg="No tasks to analyze." />
          }
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4 flex-shrink-0">
          {[
            ["Done", donutS[0], "#2EB67D"],
            ["Active", donutS[1], "#36C5F0"],
            ["Review", donutS[2], "#ECB22E"],
            ["To Do", donutS[3], "#E0E0D8"]
          ].map(([l, n, c]) => (
            <div key={l as string} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
              <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: c as string }} />
              <span className="text-[10px] font-semibold text-gray-500 flex-1 truncate uppercase tracking-wider">{l as string}</span>
              <span className="text-[12px] font-bold text-gray-900">{n as number}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
