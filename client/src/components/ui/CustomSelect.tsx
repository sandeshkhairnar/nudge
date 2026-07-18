"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  subtitle?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchable = false,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchable?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    (o.subtitle && o.subtitle.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 bg-white border ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-300'} rounded-lg text-[13px] text-gray-900 cursor-pointer flex items-center justify-between transition-all`}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="flex-shrink-0">{selectedOption.icon}</span>}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-[200] top-[calc(100%+4px)] left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          >
            {searchable && (
              <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Search size={14} className="text-gray-400 flex-shrink-0 ml-1" />
                <input 
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-gray-400 text-gray-900 w-full"
                />
              </div>
            )}
            <div className="max-h-[240px] overflow-y-auto p-1" style={{ scrollbarWidth: 'thin' }}>
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-[12px] text-gray-500">No results found.</div>
              ) : (
                filteredOptions.map(option => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full px-2 py-2 flex items-center justify-between gap-2 rounded-md cursor-pointer transition-colors ${
                      value === option.value ? "bg-indigo-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {option.icon && <span className="flex-shrink-0">{option.icon}</span>}
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[13px] truncate ${value === option.value ? "font-semibold text-indigo-700" : "text-gray-700"}`}>
                          {option.label}
                        </span>
                        {option.subtitle && (
                          <span className="text-[11px] text-gray-500 truncate">{option.subtitle}</span>
                        )}
                      </div>
                    </div>
                    {value === option.value && <Check size={14} className="text-indigo-600 flex-shrink-0" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
