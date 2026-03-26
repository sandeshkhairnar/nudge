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
    chart: { type: "bar", stacked: true, toolbar: { show: false }, background: "transparent", fontFamily: "inherit", animations: { enabled: true, speed: 600 } },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "50%", borderRadiusApplication: "end" } },
    colors: ["#2EB67D", "#36C5F0", "#EBEBEB"],
    dataLabels: { enabled: false },
    xaxis: { categories: weekly.map(w => w.week), labels: { style: { colors: "#9CA3AF", fontSize: "10px" } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: "#9CA3AF", fontSize: "10px" } }, tickAmount: 3 },
    grid: { borderColor: "#F0F0EB", strokeDashArray: 4, padding: { left: -4, right: 0, top: -6, bottom: 0 } },
    legend: { show: false }, tooltip: { theme: "light" }, fill: { opacity: 1 },
  };

  const velSeries = [
    { name: "Done", data: weekly.map(w => w.done) },
    { name: "Active", data: weekly.map(w => w.inProgress) },
    { name: "Todo", data: weekly.map(w => w.todo) },
  ];

  return (
    <Card className="flex flex-col flex-1 min-h-[360px] sm:min-h-[400px]">
      <CardHeader title="Task velocity" sub="Sprint distribution"
        right={
          <div className="flex items-center gap-3">
            {[["Done", "#2EB67D"], ["Active", "#36C5F0"], ["Todo", "#EBEBEB"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm" style={{ background: c }} />
                <span className="text-[10px] font-semibold text-[#B0B0A8]">{l}</span>
              </div>
            ))}
          </div>
        }
      />
      <div className="flex-1 px-4 pb-3 pt-2 min-h-0">
        {tasks.length > 0
          ? <Chart options={velOpts} series={velSeries} type="bar" height="100%" />
          : (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-[#F5F5F2] flex items-center justify-center mb-2 text-[#C8C8C0]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="13" width="4" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
                  <rect x="10" y="8" width="4" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
                  <rect x="17" y="3" width="4" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 2" />
                </svg>
              </div>
              <p className="text-[13px] font-black text-[#0D0D0D] mb-1">No velocity data</p>
              <p className="text-[11px] text-[#B0B0A8] text-center max-w-[180px]">Complete tasks to see sprint velocity here.</p>
            </div>
          )
        }
      </div>
    </Card>
  );
}
