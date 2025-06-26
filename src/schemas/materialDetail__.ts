// lib/schemas/material.ts
import { z } from "zod";

// Enum schemas
export const MaterialCategorySchema = z.enum([
  "ELECTRONIC",
  "MECHANICAL",
  "CHEMICAL",
  "PACKAGING",
  "TOOLS",
  "SPARE_PARTS",
  "CONSUMABLES",
  "RAW_MATERIAL",
]);

export const UnitSchema = z.enum([
  "PCS",
  "KG",
  "LITER",
  "METER",
  "BOX",
  "ROLL",
  "SET",
  "PACK",
]);

export const BrandSchema = z.enum([
  "SAMSUNG",
  "BOSCH",
  "SONY",
  "PANASONIC",
  "MITSUBISHI",
  "SIEMENS",
  "ABB",
  "SCHNEIDER",
  "GENERIC",
  "OTHER",
]);

export const TransactionStatusSchema = z.enum([
  "DRAFT",
  "CONFIRMED",
  "CANCELLED",
]);

// Material schemas
export const CreateMaterialSchema = z.object({
  code: z
    .string()
    .min(1, "Kode material harus diisi")
    .max(50, "Kode material maksimal 50 karakter")
    .regex(
      /^[A-Z0-9-_]+$/,
      "Kode hanya boleh huruf besar, angka, tanda hubung dan underscore"
    ),

  name: z
    .string()
    .min(1, "Nama material harus diisi")
    .max(200, "Nama material maksimal 200 karakter"),

  description: z
    .string()
    .max(1000, "Deskripsi maksimal 1000 karakter")
    .optional(),

  category: MaterialCategorySchema,
  unit: UnitSchema,
  brand: BrandSchema,

  minimumStock: z
    .number()
    .int("Minimum stock harus berupa bilangan bulat")
    .min(0, "Minimum stock tidak boleh negatif")
    .default(0),

  maximumStock: z
    .number()
    .int("Maximum stock harus berupa bilangan bulat")
    .min(0, "Maximum stock tidak boleh negatif")
    .optional(),
});

export const UpdateMaterialSchema = CreateMaterialSchema.partial();

// Material IN Item schema
export const MaterialInItemSchema = z
  .object({
    materialId: z.string().cuid("Material ID tidak valid"),
    quantity: z
      .number()
      .int("Jumlah harus berupa bilangan bulat")
      .positive("Jumlah harus positif"),
    unitPrice: z.number().positive("Harga satuan harus positif"),
    notes: z.string().max(200, "Catatan item maksimal 200 karakter").optional(),
  })
  .transform((data) => ({
    ...data,
    totalPrice: data.quantity * data.unitPrice,
  }));

// Material IN schema (Header + Items)
export const CreateMaterialInSchema = z
  .object({
    supplierId: z.string().cuid("Supplier ID tidak valid"),
    supplierName: z
      .string()
      .min(1, "Nama supplier harus diisi")
      .max(200, "Nama supplier maksimal 200 karakter"),

    transactionDate: z.coerce.date().default(() => new Date()),
    invoiceNo: z
      .string()
      .max(100, "Nomor invoice maksimal 100 karakter")
      .optional(),

    notes: z.string().max(1000, "Catatan maksimal 1000 karakter").optional(),

    // Multi items
    items: z
      .array(MaterialInItemSchema)
      .min(1, "Minimal 1 item harus ada")
      .max(50, "Maksimal 50 item per transaksi"),
  })
  .refine(
    (data) => {
      // Validasi tidak ada material yang duplikat
      const materialIds = data.items.map((item) => item.materialId);
      const uniqueIds = new Set(materialIds);
      return materialIds.length === uniqueIds.size;
    },
    {
      message: "Material tidak boleh duplikat dalam satu transaksi",
      path: ["items"],
    }
  )
  .transform((data) => {
    // Hitung total amount otomatis
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );
    return {
      ...data,
      totalAmount,
    };
  });

// Material OUT Item schema
export const MaterialOutItemSchema = z
  .object({
    materialId: z.string().cuid("Material ID tidak valid"),
    quantity: z
      .number()
      .int("Jumlah harus berupa bilangan bulat")
      .positive("Jumlah harus positif"),
    unitCost: z.number().positive("Cost per unit harus positif").optional(),
    notes: z.string().max(200, "Catatan item maksimal 200 karakter").optional(),
  })
  .transform((data) => ({
    ...data,
    totalCost: data.unitCost ? data.quantity * data.unitCost : undefined,
  }));

// Material OUT schema (Header + Items)
export const CreateMaterialOutSchema = z
  .object({
    customerId: z.string().cuid("Customer ID tidak valid").optional(),
    customerName: z
      .string()
      .max(200, "Nama customer maksimal 200 karakter")
      .optional(),

    orderId: z.string().cuid("Order ID tidak valid").optional(),
    shipmentId: z.string().cuid("Shipment ID tidak valid").optional(),

    destinationType: z.string().min(1, "Tipe tujuan harus diisi"),

    transactionDate: z.coerce.date().default(() => new Date()),

    notes: z.string().max(1000, "Catatan maksimal 1000 karakter").optional(),

    // Multi items
    items: z
      .array(MaterialOutItemSchema)
      .min(1, "Minimal 1 item harus ada")
      .max(50, "Maksimal 50 item per transaksi"),
  })
  .refine(
    (data) => {
      // Validasi tidak ada material yang duplikat
      const materialIds = data.items.map((item) => item.materialId);
      const uniqueIds = new Set(materialIds);
      return materialIds.length === uniqueIds.size;
    },
    {
      message: "Material tidak boleh duplikat dalam satu transaksi",
      path: ["items"],
    }
  )
  .refine(
    (data) => {
      // Minimal salah satu tujuan harus diisi jika destinationType bukan INTERNAL_USE
      if (
        data.destinationType !== "INTERNAL_USE" &&
        data.destinationType !== "WASTE"
      ) {
        return (
          data.customerId ||
          data.customerName ||
          data.orderId ||
          data.shipmentId
        );
      }
      return true;
    },
    {
      message: "Minimal salah satu tujuan harus diisi untuk tipe destinasi ini",
      path: ["customerId"],
    }
  )
  .transform((data) => {
    // Hitung total value jika ada unit cost
    const totalValue = data.items.reduce(
      (sum, item) => sum + (item.totalCost || 0),
      0
    );
    return {
      ...data,
      totalValue: totalValue > 0 ? totalValue : undefined,
    };
  });

// Query schemas
export const MaterialInQuerySchema = z.object({
  supplierId: z.string().cuid().optional(),
  status: TransactionStatusSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  transactionNo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const MaterialOutQuerySchema = z.object({
  customerId: z.string().cuid().optional(),
  orderId: z.string().cuid().optional(),
  shipmentId: z.string().cuid().optional(),
  destinationType: z.string().optional(),
  status: TransactionStatusSchema.optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  transactionNo: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const StockHistoryQuerySchema = z.object({
  materialId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  type: z.enum(["IN", "OUT", "ALL"]).default("ALL"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Response schemas
export const MaterialResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: MaterialCategorySchema,
  unit: UnitSchema,
  brand: BrandSchema,
  currentStock: z.number(),
  minimumStock: z.number(),
  maximumStock: z.number().nullable(),
  lastPurchasePrice: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MaterialInItemResponseSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  notes: z.string().nullable(),
  stockBefore: z.number(),
  stockAfter: z.number(),
  material: MaterialResponseSchema.optional(),
});

export const MaterialInResponseSchema = z.object({
  id: z.string(),
  transactionNo: z.string(),
  supplierId: z.string(),
  supplierName: z.string(),
  transactionDate: z.date(),
  invoiceNo: z.string().nullable(),
  status: TransactionStatusSchema,
  totalAmount: z.number(),
  notes: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdByUser: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  items: z.array(MaterialInItemResponseSchema).optional(),
});

export const MaterialOutItemResponseSchema = z.object({
  id: z.string(),
  materialId: z.string(),
  quantity: z.number(),
  unitCost: z.number().nullable(),
  totalCost: z.number().nullable(),
  notes: z.string().nullable(),
  stockBefore: z.number(),
  stockAfter: z.number(),
  material: MaterialResponseSchema.optional(),
});

export const MaterialOutResponseSchema = z.object({
  id: z.string(),
  transactionNo: z.string(),
  customerId: z.string().nullable(),
  customerName: z.string().nullable(),
  orderId: z.string().nullable(),
  shipmentId: z.string().nullable(),
  destinationType: z.string(),
  transactionDate: z.date(),
  status: TransactionStatusSchema,
  totalValue: z.number().nullable(),
  notes: z.string().nullable(),
  createdBy: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdByUser: z
    .object({
      id: z.string(),
      name: z.string(),
      email: z.string(),
    })
    .optional(),
  items: z.array(MaterialOutItemResponseSchema).optional(),
});

// Type exports
export type CreateMaterial = z.infer<typeof CreateMaterialSchema>;
export type UpdateMaterial = z.infer<typeof UpdateMaterialSchema>;
export type MaterialInItem = z.infer<typeof MaterialInItemSchema>;
export type CreateMaterialIn = z.infer<typeof CreateMaterialInSchema>;
export type MaterialOutItem = z.infer<typeof MaterialOutItemSchema>;
export type CreateMaterialOut = z.infer<typeof CreateMaterialOutSchema>;
export type MaterialInQuery = z.infer<typeof MaterialInQuerySchema>;
export type MaterialOutQuery = z.infer<typeof MaterialOutQuerySchema>;
export type StockHistoryQuery = z.infer<typeof StockHistoryQuerySchema>;
export type MaterialResponse = z.infer<typeof MaterialResponseSchema>;
export type MaterialInResponse = z.infer<typeof MaterialInResponseSchema>;
export type MaterialOutResponse = z.infer<typeof MaterialOutResponseSchema>;
