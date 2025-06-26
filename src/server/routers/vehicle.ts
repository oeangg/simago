import { vehicleSchema, vehicleUpdateSchema } from "@/schemas/vehicle";
import { protectedProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const vehicleRouter = router({
  createVehicle: protectedProcedure
    .input(vehicleSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const vehicleIsExist = await ctx.db.vehicle.findUnique({
          where: {
            vehicleNumber: input.vehicleNumber,
          },
        });

        if (vehicleIsExist) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Nomor kendaraan sudah terdaftar!",
          });
        }

        const newVehicle = await ctx.db.vehicle.create({
          data: {
            ...input,
          },
        });

        return {
          message: "Data kendaraan berhasil ditambahkan",
          data: newVehicle,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan data kendaraan",
        });
      }
    }),

  updateVehicle: protectedProcedure
    .input(vehicleUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const vehicleIsExist = await ctx.db.vehicle.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!vehicleIsExist) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "id kendaraan tidak ditemukan!",
          });
        }

        if (input.vehicleNumber !== vehicleIsExist.vehicleNumber) {
          const numberExists = await ctx.db.vehicle.findUnique({
            where: { vehicleNumber: input.vehicleNumber },
          });

          if (numberExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "nomor kendaraan sudah terdaftar",
            });
          }
        }

        const result = await ctx.db.vehicle.update({
          where: {
            id: input.id,
          },
          data: {
            ...input,
          },
        });

        return {
          success: true,
          message: "Data kendaraan berhasil diupdate!",
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate data kendaraan",
        });
      }
    }),

  deleteVehicle: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const findVehicle = await ctx.db.vehicle.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!findVehicle) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kendaraan tidak ditemukan!",
          });
        }

        await ctx.db.vehicle.delete({
          where: {
            id: input.id,
          },
        });

        return {
          success: true,
          message: "Kendaraan berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus kendaraan",
        });
      }
    }),

  getVehicleById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const vehicle = await ctx.db.vehicle.findUnique({
          where: {
            id: input.id,
          },
        });

        if (!vehicle) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Kendaraan tidak ditemukan",
          });
        }

        return vehicle;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Get vehicle error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data kendaraan",
        });
      }
    }),

  getAllVehicle: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
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
                      vehicleNumber: {
                        contains: input.search,
                        mode: "insensitive" as const,
                      },
                    },
                    {
                      vehicleName: {
                        contains: input.search,
                        mode: "insensitive" as const,
                      },
                    },
                  ],
                }
              : {},
          ],
        };

        const [vehicles, total] = await Promise.all([
          ctx.db.vehicle.findMany({
            where,
            skip: (input.page - 1) * input.limit,
            take: input.limit,

            orderBy: { createdAt: "desc" },
          }),
          ctx.db.vehicle.count({ where }),
        ]);

        return {
          data: vehicles,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        console.error("Get all vehicle error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data semua kendaraan",
        });
      }
    }),
});
