"use client";

import dynamic from "next/dynamic";
import { Card, CardHeader } from "./DashboardBase";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface VelocityCardProps {
  tasks: any[];
  weekly: { week: string; done: number; inProgress: number; todo: number }[];
}

export default function VelocityCard({ tasks, weekly }: VelocityCardProps) {
  const velOpts: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "inherit",
      animations: { enabled: true, speed: 800 }
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        columnWidth: "45%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last"
      }
    },
    colors: ["#2EB67D", "#36C5F0", "rgba(0,0,0,0.05)"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: weekly.map(w => w.week),
      labels: { style: { colors: "#B0B0A8", fontSize: "10px", fontWeight: 700 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: "#B0B0A8", fontSize: "10px", fontWeight: 700 } },
      tickAmount: 3
    },
    grid: {
      borderColor: "rgba(0,0,0,0.03)",
      strokeDashArray: 4,
      padding: { left: 10, right: 10, top: 0, bottom: 0 }
    },
    legend: { show: false },
    tooltip: {
      theme: "light",
      style: { fontSize: "11px", fontFamily: "inherit" },
      y: { formatter: (v) => `${v} tasks` }
    },
    fill: { opacity: 1 },
    states: {
      hover: { filter: { type: "darken" } }
    }
  };

  const velSeries = [
    { name: "Done", data: weekly.map(w => w.done) },
    { name: "Active", data: weekly.map(w => w.inProgress) },
    { name: "Todo", data: weekly.map(w => w.todo) },
  ];

  return (
    <Card className="flex flex-col flex-1 min-h-[360px] sm:min-h-[400px]">
      <CardHeader
        title="Task Velocity"
        sub="Weekly distribution"
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        right={
          <div className="flex items-center flex-nowrap gap-3 sm:gap-4 bg-[#F9F9F8] px-3 py-1.5 rounded-xl border border-[#F4F4F0] min-w-max">
            {[["Done", "#2EB67D"], ["Active", "#36C5F0"], ["Todo", "#E0E0D8"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 8px ${c}40` }} />
                <span className="text-[10px] font-[800] text-[#111111] tracking-tight uppercase whitespace-nowrap">{l}</span>
              </div>
            ))}
          </div>
        }
      />
      <div className="flex-1 px-2 sm:px-4 pb-6 pt-2 min-h-0 min-w-0">
        {tasks.length > 0
          ? <Chart options={velOpts} series={velSeries} type="bar" height="100%" />
          : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-[22px] bg-[#F9F9F8] flex items-center justify-center mb-4 text-[#A0A09B] border border-[#F4F4F0]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="13" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <rect x="10" y="8" width="4" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  <rect x="17" y="3" width="4" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
              <p className="text-[15px] font-[800] text-[#111111] mb-1">No velocity data</p>
              <p className="text-[11px] text-[#A0A09B] text-center max-w-[220px] leading-relaxed">Velocity metrics will appear here once tasks are completed in the selected workspace.</p>
            </div>
          )
        }
      </div>
    </Card>
  );
}
