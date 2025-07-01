// Import hooks dan komponen yang dibutuhkan
import { useState } from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { ChevronsUpDown, Check } from "lucide-react";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { TableCell } from "@/components/ui/table";
import { StockType } from "@prisma/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
interface Material {
  id: string;
  code: string;
  name: string;
  unit: string;
  goodStock: number;
  badStock: number;
  lastPurchasePrice?: number | null;
}
// Definisikan tipe untuk setiap item di 'items' array
interface Item {
  materialId: string;
  stockType: "GOOD" | "BAD"; // asumsi tipe ini
  // ... properti item lainnya
}

interface FormSchema {
  transactionNo: string;
  supplierId: string;
  supplierName: string;
  transactionDate: Date;
  invoiceNo: string;
  totalAmountBeforeTax: number;
  totalTax: number;
  otherCosts: number;
  totalAmount: number;
  notes: string;
  items: {
    materialId: string;
    stockType: StockType;
    quantity: number;
    unitPrice: number;
    notes: string;
  }[];
}

interface MaterialSelectCellProps {
  form: UseFormReturn<FormSchema>;

  index: number;

  materials: Material[];

  watchItems: Item[];
  isEdit: boolean;
}

// Komponen baru untuk satu sel/baris
export function MaterialSelectCell({
  form,
  index,
  materials,
  watchItems,
  isEdit,
}: MaterialSelectCellProps) {
  // State untuk Popover ini sekarang lokal untuk komponen ini saja
  const [openOptionMaterial, setOpenOptionMaterial] = useState(false);

  // Dapatkan nilai field saat ini untuk render
  const materialId = form.getValues(`items.${index}.materialId`);
  const material = materials.find((mat) => mat.id === materialId);

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <TableCell>
      <FormField
        control={form.control}
        name={`items.${index}.materialId`}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <Popover
              open={openOptionMaterial}
              onOpenChange={setOpenOptionMaterial}
            >
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={isEdit}
                    aria-expanded={openOptionMaterial}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {material
                      ? `${material.code} - ${material.name}`
                      : "Pilih material"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder="Cari material..." />
                  <CommandEmpty>Material tidak ditemukan.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {materials.map((mat) => (
                      <CommandItem
                        key={mat.id}
                        value={`${mat.code} ${mat.name}`}
                        onSelect={() => {
                          field.onChange(mat.id);

                          // Auto-fill price dari last purchase price
                          if (mat.lastPurchasePrice) {
                            form.setValue(
                              `items.${index}.unitPrice`,
                              mat.lastPurchasePrice
                            );
                          }
                          setOpenOptionMaterial(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === mat.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>
                            {mat.code} - {mat.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Good: {mat.goodStock} | Bad: {mat.badStock}{" "}
                            {mat.unit}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {mat.lastPurchasePrice && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {formatCurrency(mat.lastPurchasePrice)}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Harga pembelian terakhir</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
            {material && (
              <p className="text-xs font-thin text-muted-foreground">
                Stok {watchItems[index]?.stockType === "BAD" ? "Bad" : "Good"}:{" "}
                {watchItems[index]?.stockType === "BAD"
                  ? material.badStock
                  : material.goodStock}{" "}
                {material.unit}
              </p>
            )}
          </FormItem>
        )}
      />
    </TableCell>
  );
}
