import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const CHIP_STYLES: Record<string, { bg: string; fg: string }> = {
  // Statuses
  todo: { bg: "FFF3F4F6", fg: "FF4B5563" },         // Gray
  in_progress: { bg: "FFEFF6FF", fg: "FF2563EB" },  // Blue
  review: { bg: "FFFEF3C7", fg: "FFD97706" },       // Amber
  done: { bg: "FFECFDF5", fg: "FF059669" },         // Emerald
  
  // Priorities
  low: { bg: "FFF3F4F6", fg: "FF4B5563" },          // Gray
  medium: { bg: "FFFFFBEB", fg: "FFB45309" },       // Amber (lighter)
  high: { bg: "FFFEF2F2", fg: "FFDC2626" },         // Red
};

function applyChipStyle(cell: ExcelJS.Cell, key: string) {
  const style = CHIP_STYLES[key] || CHIP_STYLES.todo;
  cell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: style.bg },
  };
  cell.font = {
    bold: true,
    color: { argb: style.fg },
  };
  cell.alignment = { vertical: "middle", horizontal: "center" };
}

export async function exportTasksToExcel(tasks: any[], projectName: string) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Tasks");

  // ─── Headers ──────────────────────────────────────────
  worksheet.columns = [
    { header: "Sr. No", key: "sr_no", width: 10 },
    { header: "Type", key: "type", width: 15 },
    { header: "Title", key: "title", width: 50 },
    { header: "Description", key: "description", width: 60 },
    { header: "Status", key: "status", width: 15 },
    { header: "Priority", key: "priority", width: 15 },
    { header: "Assignee", key: "assignee", width: 25 },
    { header: "Due Date", key: "due_date", width: 15 },
    { header: "Created At", key: "created_at", width: 20 },
  ];

  // ─── Header Styling ──────────────────────────────────
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F46E5" }, // Indigo 600
  };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  headerRow.height = 25;

  // ─── Data Rows ────────────────────────────────────────
  const topLevelTasks = tasks.filter((t) => !t.parent_task_id);

  topLevelTasks.forEach((task, index) => {
    const srNo = index + 1;
    // 1) Add Parent Task
    const row = worksheet.addRow({
      sr_no: srNo,
      type: (task.type || "task").toUpperCase(),
      title: task.title,
      description: task.description ? task.description.substring(0, 150) + (task.description.length > 150 ? "..." : "") : "",
      status: task.status.toUpperCase().replace("_", " "),
      priority: task.priority?.toUpperCase() ?? "MEDIUM",
      assignee: task.assignee?.full_name || "Unassigned",
      due_date: task.due_date ? new Date(task.due_date).toLocaleDateString() : "-",
      created_at: new Date(task.created_at).toLocaleString(),
    });

    // Apply chip styles to status and priority
    applyChipStyle(row.getCell("status"), task.status.toLowerCase());
    applyChipStyle(row.getCell("priority"), task.priority?.toLowerCase() || "medium");

    // Striping
    if (row.number % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF9FAFB" }, // Gray 50
      };
    }

    row.alignment = { vertical: "middle", wrapText: true };
    row.height = 40;

    // 2) Add Subtasks
    if (task.subtasks && Array.isArray(task.subtasks)) {
      task.subtasks.forEach((subtask: any, subIndex: number) => {
        const subRow = worksheet.addRow({
          sr_no: `${srNo}.${subIndex + 1}`,
          type: (subtask.type || "task").toUpperCase(),
          title: `   ↳ ${subtask.title}`,
          description: subtask.description ? subtask.description.substring(0, 150) + (subtask.description.length > 150 ? "..." : "") : "",
          status: subtask.status.toUpperCase().replace("_", " "),
          priority: subtask.priority?.toUpperCase() ?? "MEDIUM",
          assignee: subtask.assignee?.full_name || subtask.assignee || "Unassigned",
          due_date: subtask.dueDate || subtask.due_date ? new Date(subtask.dueDate || subtask.due_date!).toLocaleDateString() : "-",
          created_at: new Date(subtask.created_at || new Date()).toLocaleString(),
        });

        subRow.font = { italic: true, color: { argb: "FF4B5563" } }; // Gray 600
        subRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF3F4F6" }, // Gray 100 for subtasks
        };

        // Apply chip styles to subtask status and priority
        applyChipStyle(subRow.getCell("status"), subtask.status.toLowerCase());
        applyChipStyle(subRow.getCell("priority"), subtask.priority?.toLowerCase() || "medium");
        subRow.alignment = { vertical: "middle", wrapText: true };
        subRow.height = 30;
      });
    }
  });

  // ─── Borders ──────────────────────────────────────────
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
    });
  });

  // ─── Export ───────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `${projectName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_tasks_${new Date().getTime()}.xlsx`);
}
