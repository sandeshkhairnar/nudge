export default function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-5 px-1 select-none">
      <div className="flex-1 h-px bg-gray-100" />
      <span className="text-[11px] font-semibold text-gray-400 px-3 py-1 bg-white border border-gray-100 rounded-full shadow-sm">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}
