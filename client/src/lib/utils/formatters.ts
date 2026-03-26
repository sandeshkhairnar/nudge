export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getDayAge(iso: string): number {
  return Math.floor(
    (new Date().getTime() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /```([\s\S]*?)```/g,
      '<pre style="background:#F3F4F6;color:#374151;padding:10px 14px;border-radius:8px;font-size:12px;font-family:monospace;overflow-x:auto;margin:4px 0;line-height:1.6"><code>$1</code></pre>'
    )
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .replace(
      /`([^`]+)`/g,
      '<code style="background:#F3F4F6;color:#374151;padding:1px 5px;border-radius:4px;font-size:12px;font-family:monospace">$1</code>'
    )
    .replace(
      /^#{3}\s(.+)$/gm,
      '<h3 style="font-size:14px;font-weight:800;color:#111827;margin:8px 0 2px">$1</h3>'
    )
    .replace(
      /^#{2}\s(.+)$/gm,
      '<h2 style="font-size:15px;font-weight:800;color:#111827;margin:8px 0 2px">$1</h2>'
    )
    .replace(
      /^#{1}\s(.+)$/gm,
      '<h1 style="font-size:16px;font-weight:900;color:#111827;margin:8px 0 2px">$1</h1>'
    )
    .replace(
      /^[-*]\s(.+)$/gm,
      '<li style="margin-left:16px;list-style:disc;color:#374151;font-size:13.5px">$1</li>'
    )
    .replace(
      /@(\w+)/g,
      '<span style="color:#3B82F6;font-weight:700;background:#EFF6FF;border-radius:4px;padding:0 3px">@$1</span>'
    )
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" style="color:#3B82F6;font-weight:700;text-decoration:none;hover:underline">$1</a>'
    )
    .replace(/\n/g, "<br/>");
}
