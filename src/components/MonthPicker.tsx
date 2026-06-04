import { MONTHS_PT } from "@/lib/finance";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthPicker({
  year, month, onChange,
}: { year: number; month: number; onChange: (y: number, m: number) => void }) {
  function shift(delta: number) {
    let m = month + delta, y = year;
    if (m < 1) { m = 12; y--; }
    if (m > 12) { m = 1; y++; }
    onChange(y, m);
  }
  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Mês anterior">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="min-w-[160px] text-center font-medium text-sm md:text-base">
        {MONTHS_PT[month - 1]} {year}
      </div>
      <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Próximo mês">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
