import { Input } from "@/components/ui/input";
import type { Column } from "@tanstack/react-table";

interface FilterInputProps<TData, TValue> {
  placeholder: string;
  column: Column<TData, TValue> | undefined;
}

export function FilterInput<TData, TValue>({
  column,
  placeholder,
}: FilterInputProps<TData, TValue>) {
  if (!column) {
    return null;
  }
  return (
    <Input
      placeholder={placeholder}
      value={(column.getFilterValue() as string) ?? ""}
      onChange={(event) => column.setFilterValue(event.target.value)}
    />
  );
}
