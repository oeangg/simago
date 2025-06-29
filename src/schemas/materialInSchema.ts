import { StockType } from "@prisma/client";
import { z } from "zod";

const stockTypeEnum = z.nativeEnum(StockType);
// ========== Base Schemas ==========

// Material In Item Schema
export const materialInItemSchema = z.object({
  id: z.string().cuid().optional(),
  materialInId: z.string().cuid(),
  materialId: z.string().cuid(),
  quantity: z.number().int().positive(),
  unitPrice: z.union([z.number(), z.any()]).transform((val) => Number(val)),
  totalPrice: z.union([z.number(), z.any()]).transform((val) => Number(val)),
  notes: z.string().nullable().optional(),
  stockType: stockTypeEnum.default("GOOD"),
  stockBefore: z.number().int().min(0),
  stockAfter: z.number().int().min(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Material In Schema
export const materialInSchema = z.object({
  id: z.string().cuid().optional(),
  transactionNo: z.string().min(1),
  supplierId: z.string().cuid(),
  supplierName: z.string().min(1),
  transactionDate: z.date().optional(),
  invoiceNo: z.string().nullable().optional(),
  totalAmountBeforeTax: z
    .union([z.number(), z.any()])
    .transform((val) => Number(val)),
  totalTax: z
    .union([z.number(), z.any()])
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
  otherCosts: z
    .union([z.number(), z.any()])
    .nullable()
    .optional()
    .transform((val) => (val ? Number(val) : null)),
  totalAmount: z.union([z.number(), z.any()]).transform((val) => Number(val)),
  notes: z.string().nullable().optional(),
  createdBy: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  items: z.array(materialInItemSchema).optional(),
});

// ========== Input Schemas for TRPC Router ==========

// Create Material In Item Input
export const createMaterialInItemInput = z.object({
  materialId: z.string().cuid(),
  stockType: stockTypeEnum.optional().default("GOOD"),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  notes: z.string().optional().default(""),
});

// Create Material In Input
export const createMaterialInInput = z.object({
  supplierId: z.string().cuid(),
  supplierName: z.string().min(1),
  transactionDate: z.date().optional(), // Optional karena ada default(now()) di Prisma
  invoiceNo: z.string().optional().default(""),
  totalAmountBeforeTax: z.number().positive(),
  totalTax: z.number().min(0).optional().default(0),
  otherCosts: z.number().min(0).optional().default(0),
  totalAmount: z.number().positive(),
  notes: z.string().optional().default(""),
  items: z.array(createMaterialInItemInput).min(1),
});

// Update Material In Input
export const updateMaterialInInput = z.object({
  id: z.string().cuid(),
  supplierId: z.string().cuid().optional(),
  supplierName: z.string().min(1).optional(),
  transactionDate: z.date().optional(),
  invoiceNo: z.string().optional(),
  totalAmountBeforeTax: z.number().positive().optional(),
  totalTax: z.number().min(0).optional(),
  otherCosts: z.number().min(0).optional(),
  totalAmount: z.number().positive().optional(),
  notes: z.string().optional(),
});

// ========== Query Schemas ==========

// Get Material In by ID
export const getMaterialInByIdInput = z.object({
  id: z.string().cuid(),
});

// Get Material Ins with Pagination and Filters
export const getMaterialInsInput = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  supplierId: z.string().cuid().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  sortBy: z
    .enum(["transactionDate", "transactionNo", "totalAmount", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Delete Material In
export const deleteMaterialInInput = z.object({
  id: z.string().cuid(),
});

// ========== Type Exports ==========

export type MaterialIn = z.infer<typeof materialInSchema>;
export type MaterialInItem = z.infer<typeof materialInItemSchema>;
export type CreateMaterialInInput = z.infer<typeof createMaterialInInput>;
export type UpdateMaterialInInput = z.infer<typeof updateMaterialInInput>;
export type GetMaterialInByIdInput = z.infer<typeof getMaterialInByIdInput>;
export type GetMaterialInsInput = z.infer<typeof getMaterialInsInput>;
export type DeleteMaterialInInput = z.infer<typeof deleteMaterialInInput>;
