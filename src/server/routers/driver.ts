import { driverSchema, driverUpdateSchema } from "@/schemas/driverSchema";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Gender } from "@prisma/client";
import { z } from "zod";
import { generateCodeAutoNumber } from "@/tools/generateCodeAutoNumber";

const requiredDateSchema = z.string().transform((str) => new Date(str));

const InputDriverSchema = driverSchema.extend({
  activeDate: requiredDateSchema,
});

const UpdateDriverSchema = driverUpdateSchema.extend({
  activeDate: requiredDateSchema,
});

export const driverRouter = router({
  createDriver: protectedProcedure
    .input(InputDriverSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const userId = ctx.session?.userId;

        if (!userId) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          });
        }
        const code = await generateCodeAutoNumber({
          db: ctx.db,
          prefix: "DV",
          tableName: "drivers",
          fieldName: "code",
        });

        const newDriver = await ctx.db.driver.create({
          data: {
            code,
            name: input.name,
            city: input.city,
            gender: input.gender as Gender,
            phoneNumber: input.phoneNumber,
            activeDate: input.activeDate,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 || null,
          },
        });

        return {
          message: "Driver berhasil ditambahkan",
          data: newDriver,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan driver",
        });
      }
    }),

  updateDriver: protectedProcedure
    .input(UpdateDriverSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const driverIsExist = await ctx.db.driver.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!driverIsExist) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "id driver tidak ditemukan!",
          });
        }

        const result = await ctx.db.driver.update({
          where: {
            id: input.id,
          },
          data: {
            name: input.name,
            city: input.city,
            gender: input.gender as Gender,
            phoneNumber: input.phoneNumber,
            activeDate: input.activeDate,
            statusActive: input.statusActive,
            addressLine1: input.addressLine1,
            addressLine2: input.addressLine2 || null,
          },
        });

        return {
          success: true,
          message: "Driver berhasil diupdate!",
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan driver",
        });
      }
    }),

  deleteDriver: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const findDriver = await ctx.db.driver.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!findDriver) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Driver tidak ditemukan!",
          });
        }

        await ctx.db.driver.delete({
          where: {
            id: input.id,
          },
        });

        return {
          success: true,
          message: "Driver berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus driver",
        });
      }
    }),

  getDriverById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const driver = await ctx.db.driver.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!driver) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Driver tidak ditemukan",
          });
        }

        return driver;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Get driver error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data driver",
        });
      }
    }),

  getAllDrivers: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        statusActive: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const where = {
          AND: [
            input.search
              ? {
                  OR: [
                    {
                      name: {
                        contains: input.search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      code: {
                        contains: input.search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {},
            input.statusActive ? { statusActive: input.statusActive } : {},
          ],
        };

        const [drivers, total] = await Promise.all([
          ctx.db.driver.findMany({
            where,
            skip: (input.page - 1) * input.limit,
            take: input.limit,

            orderBy: { createdAt: "desc" },
          }),
          ctx.db.driver.count({ where }),
        ]);

        console.log(drivers);
        return {
          data: drivers,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        console.error("Get all driver error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data drivers",
        });
      }
    }),
});
