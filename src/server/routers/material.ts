import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Brand, MaterialCategory, Prisma, Unit } from "@prisma/client";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "@/schemas/materialSchema";
import { generateCodeAutoNumber } from "@/tools/generateCodeAutoNumber";

const DecimalSchema = z
  .union([
    z.number().min(0, "Harga pembelian tidak boleh negatif"),
    z.instanceof(Prisma.Decimal),
  ])
  .optional();

const CreateMaterialSchema = createMaterialSchema.extend({
  lastPurchasePrice: DecimalSchema,
});

const UpdateMaterialSchema = updateMaterialSchema.extend({
  lastPurchasePrice: DecimalSchema,
});

export const materialRouter = router({
  createMaterial: protectedProcedure
    .input(CreateMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if code already exists

        const userId = ctx.session?.userId;

        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }
        const code = await generateCodeAutoNumber({
          db: ctx.db,
          prefix: "MT",
          tableName: "materials",
          fieldName: "code",
        });

        const existingMaterial = await ctx.db.material.findUnique({
          where: { code: code },
        });

        if (existingMaterial) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Kode material sudah digunakan",
          });
        }

        const data = {
          ...input,
          code,
          lastPurchasePrice:
            input.lastPurchasePrice !== undefined &&
            input.lastPurchasePrice !== null
              ? new Prisma.Decimal(input.lastPurchasePrice)
              : null,
        };

        const material = await ctx.db.material.create({
          data,
        });

        return {
          success: true,
          message: "Material berhasil dibuat",
          data: material,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat material",
        });
      }
    }),

  updateMaterial: protectedProcedure
    .input(UpdateMaterialSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...updateData } = input;
        // Check if material exists
        const existingMaterial = await ctx.db.material.findUnique({
          where: { id },
        });

        if (!existingMaterial) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Material tidak ditemukan",
          });
        }

        const data = {
          ...updateData,
          lastPurchasePrice:
            updateData.lastPurchasePrice !== undefined &&
            updateData.lastPurchasePrice !== null
              ? new Prisma.Decimal(updateData.lastPurchasePrice)
              : null,
        };

        const material = await ctx.db.material.update({
          where: { id: input.id },
          data,
        });

        return {
          success: true,
          message: "Material berhasil diperbarui",
          data: material,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui material",
        });
      }
    }),

  getMaterialById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      try {
        const material = await ctx.db.material.findUnique({
          where: { id: input.id },
        });

        if (!material) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Material tidak ditemukan",
          });
        }

        return material;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data material",
        });
      }
    }),

  getAllMaterial: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        category: z.nativeEnum(MaterialCategory).optional(),
        unit: z.nativeEnum(Unit).optional(),
        brand: z.nativeEnum(Brand).optional(),
        sortBy: z.string().optional().default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const {
          page,
          limit,
          search,
          category,
          unit,
          brand,
          sortBy,
          sortOrder,
        } = input;
        const skip = (page - 1) * limit;

        // Build where clause with proper typing
        const where: Prisma.MaterialWhereInput = {
          ...(search && {
            OR: [
              {
                code: { contains: search, mode: "insensitive" },
              },
              {
                name: { contains: search, mode: "insensitive" },
              },
              {
                description: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }),
          ...(category && { category: category as MaterialCategory }),
          ...(unit && { unit: unit as Unit }),
          ...(brand && { brand: brand as Brand }),
        };

        // Execute queries in parallel
        const [materials, total] = await Promise.all([
          ctx.db.material.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: sortOrder },
          }),
          ctx.db.material.count({ where }),
        ]);

        return {
          data: materials,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        console.error("Get all material error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data material",
        });
      }
    }),

  deleteMaterial: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if material exists
        const material = await ctx.db.material.findUnique({
          where: { id: input.id },
          include: {
            materialInItems: true,
            materialOutItems: true,
          },
        });

        if (!material) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Material tidak ditemukan",
          });
        }

        // Check if material is being used
        if (
          material.materialInItems.length > 0 ||
          material.materialOutItems.length > 0
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Material tidak dapat dihapus karena sedang digunakan dalam transaksi",
          });
        }

        await ctx.db.material.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Material berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus material",
        });
      }
    }),
});
