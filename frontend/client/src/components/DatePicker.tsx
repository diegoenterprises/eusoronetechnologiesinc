/**
 * CUSTOM DATE PICKER
 * Styled popover calendar with:
 * - Rounded corners, gradient accents
 * - Light/dark mode adaptive
 * - Brand gradient on selected day and today indicator
 * - Uses shadcn Calendar + Popover
 */

import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

  const handleSelect = (day: Date | undefined) => {
    if (day && onChange) {
      const y = day.getFullYear();
      const m = String(day.getMonth() + 1).padStart(2, "0");
      const d = String(day.getDate()).padStart(2, "0");
      onChange(`${y}-${m}-${d}`);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all",
            "bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-600/50",
            "hover:border-purple-300 dark:hover:border-purple-500/40",
            "focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:focus:ring-purple-500/30",
            "text-slate-900 dark:text-white",
            !value && "text-slate-400 dark:text-slate-500",
            className
          )}
        >
          <span>{selectedDate ? format(selectedDate, "MM/dd/yyyy") : placeholder}</span>
          <CalendarIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-auto p-0 rounded-2xl border-0 shadow-xl",
          "bg-[#f3e8ff] dark:bg-[#1e1535]",
          "ring-1 ring-purple-200/60 dark:ring-purple-500/20"
        )}
        align="start"
        sideOffset={8}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
