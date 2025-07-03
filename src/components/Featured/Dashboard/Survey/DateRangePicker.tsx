import { Calendar } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface DateRangePickerProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[300px] justify-start text-left font-normal",
            !dateRange && "text-muted-foreground"
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {dateRange?.from ? (
            dateRange.to ? (
              <>
                {format(dateRange.from, "dd MMM yyyy")} -{" "}
                {format(dateRange.to, "dd MMM yyyy")}
              </>
            ) : (
              format(dateRange.from, "dd MMM yyyy")
            )
          ) : (
            <span>Pilih periode tanggal</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          initialFocus
          mode="range"
          defaultMonth={dateRange?.from}
          selected={dateRange}
          onSelect={onDateRangeChange}
          numberOfMonths={2}
        />
      </PopoverContent>
    </Popover>
  );
}
