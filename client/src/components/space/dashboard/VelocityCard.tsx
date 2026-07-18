"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Card, CardHeader } from "./DashboardBase";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface VelocityCardProps {
  tasks: any[];
  weekly?: any; // Ignored, we compute internally now
}

export default function VelocityCard({ tasks }: VelocityCardProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("weekly");

  const groupedData = useMemo(() => {
    let labels: string[] = [];
    if (timeframe === "daily") labels = ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"];
    else if (timeframe === "weekly") labels = ["W-5", "W-4", "W-3", "W-2", "W-1", "This Wk"];
    else if (timeframe === "monthly") labels = ["M-5", "M-4", "M-3", "M-2", "M-1", "This Mo"];

    const data = labels.map(label => ({ label, done: 0, inProgress: 0, review: 0, todo: 0 }));
    const now = new Date();

    tasks.forEach(task => {
      const createdDate = new Date(task.created_at || now);
      const diffTime = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let index = -1;
      if (timeframe === "daily") {
        if (diffDays <= 6) index = 6 - diffDays;
      } else if (timeframe === "weekly") {
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks <= 5) index = 5 - diffWeeks;
      } else if (timeframe === "monthly") {
        const diffMonths = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
        if (diffMonths >= 0 && diffMonths <= 5) index = 5 - diffMonths;
      }

      if (index >= 0 && index < labels.length) {
        if (task.status === "done") data[index].done++;
        else if (task.status === "in_progress") data[index].inProgress++;
        else if (task.status === "review") data[index].review++;
        else data[index].todo++;
      }
    });

    return data;
  }, [tasks, timeframe]);

  const velOpts: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      stacked: true,
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "inherit",
      animations: { enabled: true, speed: 800 },
      dropShadow: { enabled: true, top: 4, left: 0, blur: 4, opacity: 0.05, color: '#000' }
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: "25%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last"
      }
    },
    colors: ["#2EB67D", "#36C5F0", "#ECB22E", "#E5E7EB"],
    dataLabels: { enabled: false },
    xaxis: {
      categories: groupedData.map(w => w.label),
      labels: { style: { colors: "#9CA3AF", fontSize: "10px", fontWeight: 600 } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: { style: { colors: "#9CA3AF", fontSize: "10px", fontWeight: 600 } },
      tickAmount: 3
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 0,
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
    { name: "Done", data: groupedData.map(w => w.done) },
    { name: "Active", data: groupedData.map(w => w.inProgress) },
    { name: "Review", data: groupedData.map(w => w.review) },
    { name: "Todo", data: groupedData.map(w => w.todo) },
  ];

  return (
    <Card className="flex flex-col h-full w-full">
      <CardHeader
        title="Task Velocity"
        sub={`${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} distribution`}
        icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20V10M18 20V4M6 20v-4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        right={
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1 border border-gray-200">
            {(["daily", "weekly", "monthly"] as const).map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`relative px-3 py-1.5 rounded-md text-[10px] font-semibold cursor-pointer border-0 capitalize transition-all ${timeframe === t ? "text-gray-900 bg-white shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-700 bg-transparent"}`}
              >
                {t}
              </button>
            ))}
          </div>
        }
      />
      <div className="flex-1 px-2 sm:px-4 pb-4 pt-2 min-h-0 min-w-0 flex flex-col">
        <div className="flex-1 min-h-0 min-w-0">
          {tasks.length > 0
            ? <Chart options={velOpts} series={velSeries} type="bar" height="100%" />
            : (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mb-3 text-gray-400 border border-gray-200">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="13" width="4" height="8" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <rect x="10" y="8" width="4" height="13" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <rect x="17" y="3" width="4" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-gray-900 mb-1">No velocity data</p>
                <p className="text-[11px] text-gray-500 text-center max-w-[220px] leading-relaxed">Velocity metrics will appear here once tasks are completed in the selected workspace.</p>
              </div>
            )
          }
        </div>
        
        {tasks.length > 0 && (
          <div className="flex items-center justify-center gap-4 sm:gap-6 pt-3 mt-1 flex-shrink-0">
            {[["Done", "#2EB67D"], ["Active", "#36C5F0"], ["Review", "#ECB22E"], ["Todo", "#E5E7EB"]].map(([l, c]) => (
              <div key={l} className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c, boxShadow: `0 0 8px ${c}40` }} />
                <span className="text-[11px] font-semibold text-gray-700 tracking-tight uppercase whitespace-nowrap">{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
