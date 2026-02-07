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
          "bg-white dark:bg-slate-900",
          "ring-1 ring-slate-200 dark:ring-purple-500/20"
        )}
        align="start"
        sideOffset={8}
      >
        <div className="p-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            className={cn(
              "rounded-xl",
              "[&_.rdp-day_button]:rounded-xl",
              "[&_.rdp-day_button]:transition-all",
              "[&_.rdp-day_button]:text-slate-700 dark:[&_.rdp-day_button]:text-slate-300",
              "[&_.rdp-day_button:hover]:bg-purple-50 dark:[&_.rdp-day_button:hover]:bg-purple-500/10",
              "[&_.rdp-day_button:hover]:text-purple-700 dark:[&_.rdp-day_button:hover]:text-purple-300",
            )}
            classNames={{
              today: "bg-gradient-to-br from-[#1473FF]/15 to-[#BE01FF]/15 rounded-xl text-purple-700 dark:text-purple-300 font-bold",
              day: "relative w-full h-full p-0 text-center group/day aspect-square select-none",
            }}
            components={{
              DayButton: ({ day, modifiers, className: btnClass, ...props }) => {
                const isSelected = modifiers.selected;
                return (
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center justify-center w-9 h-9 rounded-xl text-sm font-normal transition-all",
                      isSelected
                        ? "bg-gradient-to-br from-[#BE01FF] to-[#1473FF] text-white font-semibold shadow-lg shadow-purple-500/25 dark:shadow-purple-500/30"
                        : "",
                      modifiers.outside && "text-slate-300 dark:text-slate-600",
                      modifiers.disabled && "opacity-40 cursor-not-allowed",
                      btnClass
                    )}
                    {...props}
                  />
                );
              },
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
