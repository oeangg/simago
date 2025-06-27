import { Brand, MaterialCategory, Prisma, Unit } from "@prisma/client";
import { z } from "zod";

const materialCategorySchema = z.nativeEnum(MaterialCategory);
const unitSchema = z.nativeEnum(Unit);
const brandSchema = z.nativeEnum(Brand);

const lastPurchasePriceSchema = z
  .union([
    z.number().min(0, "Harga pembelian tidak boleh negatif"),
    z.instanceof(Prisma.Decimal),
  ])
  .optional();

// Material schemas
export const createMaterialSchema = z.object({
  code: z
    .string()
    .min(1, "Kode material harus diisi")
    .max(12, "Kode material maksimal 12 karakter")
    .regex(
      /^[A-Z0-9-_]+$/,
      "Kode hanya boleh huruf besar, angka, tanda hubung dan underscore"
    ),
  name: z.string().min(1, "Nama material harus diisi"),
  description: z.string().optional(),
  category: materialCategorySchema,
  unit: unitSchema,
  brand: brandSchema,
  currentStock: z
    .number()
    .int("Current stock harus berupa bilangan bulat")
    .min(0, "Current stock tidak boleh negatif")
    .default(0),
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
  goodStock: z
    .number()
    .int("Good stock harus berupa bilangan bulat")
    .min(0, "Good stock tidak boleh negatif")
    .optional(),
  badStock: z
    .number()
    .int("Bad stock harus berupa bilangan bulat")
    .min(0, "Bad stock tidak boleh negatif")
    .optional(),
  lastPurchasePrice: lastPurchasePriceSchema,
});

export type CreateMaterialTypeSchema = z.infer<typeof createMaterialSchema>;

export const updateMaterialSchema = createMaterialSchema.extend({
  id: z.string().cuid("ID harus berupa CUID yang valid"),
});

export type UpdateMaterialTypeSchema = z.infer<typeof updateMaterialSchema>;
