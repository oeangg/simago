// ===== 1. ZOD SCHEMAS =====

import { z } from "zod";
import { QuotationStatus } from "@prisma/client";

// Base schema untuk QuotationDomestic
export const quotationDomesticBaseSchema = z.object({
  id: z.string(),
  quotationNo: z.string(),
  quotationDate: z.date(),
  surveyId: z.string(),
  customerId: z.string(),
  leadTime: z.number().int().positive(),
  marketingName: z.string().min(1),
  statusQuotation: z.nativeEnum(QuotationStatus),
  // Pricing fields
  trucking: z.number().positive().nullable(),
  packing: z.number().positive().nullable(),
  handling: z.number().positive().nullable(),
  unloading: z.number().positive().nullable(),
  reposisi: z.number().positive().nullable(),
  total: z.number().positive().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema untuk create (exclude auto-generated fields) BE
export const createQuotationDomesticSchema = z.object({
  surveyId: z.string().min(1, { message: "Invalid Survey ID" }),
  customerId: z.string().min(1, { message: "Invalid Customer ID" }),
  leadTime: z.number().int().min(1, { message: "Lead time minimum 1 hari" }),
  marketingName: z.string().min(1, { message: "Marketing name harus diisi" }),

  // Optional pricing fields
  trucking: z.number().positive().optional(),
  packing: z.number().positive().optional(),
  handling: z.number().positive().optional(),
  unloading: z.number().positive().optional(),
  reposisi: z.number().positive().optional(),
  //total sum autmatic
});

// Schema untuk update
export const updateQuotationDomesticSchema = z.object({
  id: z.string(),
  surveyId: z.string().optional(),
  customerId: z.string().optional(),
  leadTime: z.number().int().min(1).optional(),
  marketingName: z.string().min(1).optional(),
  statusQuotation: z.nativeEnum(QuotationStatus).optional(),
  // Pricing fields
  trucking: z.number().positive().nullable().optional(),
  packing: z.number().positive().nullable().optional(),
  handling: z.number().positive().nullable().optional(),
  unloading: z.number().positive().nullable().optional(),
  reposisi: z.number().positive().nullable().optional(),
  total: z.number().positive().nullable().optional(),
});

// Schema untuk update status (dengan history)
export const updateQuotationStatusSchema = z.object({
  quotationId: z.string(),
  statusQuotation: z.nativeEnum(QuotationStatus),
  remarks: z.string().optional(),
});

// Schema untuk query/filter
export const queryQuotationDomesticSchema = z.object({
  search: z.string().optional(),
  customerId: z.string().optional(),
  surveyId: z.string().optional(),
  statusQuotation: z.nativeEnum(QuotationStatus).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  orderBy: z
    .enum(["quotationNo", "quotationDate", "total", "createdAt"])
    .default("createdAt"),
  orderDirection: z.enum(["asc", "desc"]).default("desc"),
});

// ===== 2. REACT HOOK FORM TYPES & SCHEMA =====
export const quotationDomesticFormSchema = z.object({
  surveyId: z.string().min(1, { message: "Survey harus dipilih" }),
  customerId: z.string().min(1, { message: "Customer harus dipilih" }),
  leadTime: z
    .string()
    .min(1, { message: "Lead time harus di isi" })
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Width must be positive number"
    ),
  marketingName: z.string().min(1, { message: "Marketing name harus diisi" }),
  // Transform string to number for pricing fields
  trucking: z
    .union([
      z.string().transform((val) => (val ? parseFloat(val) : undefined)),
      z.number(),
      z.undefined(),
    ])
    .optional(),
  packing: z
    .union([
      z.string().transform((val) => (val ? parseFloat(val) : undefined)),
      z.number(),
      z.undefined(),
    ])
    .optional(),
  handling: z
    .union([
      z.string().transform((val) => (val ? parseFloat(val) : undefined)),
      z.number(),
      z.undefined(),
    ])
    .optional(),
  unloading: z
    .union([
      z.string().transform((val) => (val ? parseFloat(val) : undefined)),
      z.number(),
      z.undefined(),
    ])
    .optional(),
  reposisi: z
    .union([
      z.string().transform((val) => (val ? parseFloat(val) : undefined)),
      z.number(),
      z.undefined(),
    ])
    .optional(),
});

export type QuotationDomesticFormTypeSchema = z.infer<
  typeof quotationDomesticFormSchema
>;
