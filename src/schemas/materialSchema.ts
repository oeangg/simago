import { Brand, MaterialCategory, Unit } from "@prisma/client";
import { z } from "zod";

const materialCategorySchema = z.nativeEnum(MaterialCategory);
const unitSchema = z.nativeEnum(Unit);
const brandSchema = z.nativeEnum(Brand);

// Material schemas
export const createMaterialSchema = z.object({
  name: z.string().min(1, "Nama material harus diisi"),
  description: z.string().optional(),
  category: materialCategorySchema,
  unit: unitSchema,
  brand: brandSchema,
  minimumStock: z
    .number()
    .min(0, "Minimum stock tidak boleh negatif")
    .default(0),
  maximumStock: z.number().min(0).optional(),
  goodStock: z.number().min(0).optional(),
  badStock: z.number().min(0).optional(),
  lastPurchasePrice: z.number().min(0).optional(),
});

export type CreateMaterialTypeSchema = z.infer<typeof createMaterialSchema>;

export const updateMaterialSchema = createMaterialSchema.extend({
  id: z.string().cuid("ID harus berupa CUID yang valid"),
});

export type UpdateMaterialTypeSchema = z.infer<typeof updateMaterialSchema>;
