import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { positionSchema } from "@/schemas/employeeSchema"; // Sesuaikan path jika berbeda
import { TRPCError } from "@trpc/server";

export const positionRouter = router({
  // Mendapatkan semua data posisi
  getAllPositions: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.position.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Mendapatkan data posisi berdasarkan ID
  getPositionById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.position.findUnique({
        where: { id: input.id },
      });
    }),

  // Membuat data posisi baru
  createPosition: protectedProcedure
    .input(positionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const existingPosition = await ctx.db.position.findUnique({
          where: { name: input.name },
        });

        if (existingPosition) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Nama posisi sudah terdaftar!",
          });
        }

        const newPosition = await ctx.db.position.create({
          data: {
            name: input.name,
          },
        });
        return {
          message: "Posisi berhasil ditambahkan",
          data: newPosition,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan posisi",
        });
      }
    }),

  // Mengupdate data posisi
  updatePosition: protectedProcedure
    .input(positionSchema.extend({ id: z.string() })) // Menambahkan ID untuk update
    .mutation(async ({ ctx, input }) => {
      try {
        const existingPosition = await ctx.db.position.findUnique({
          where: { id: input.id },
        });

        if (!existingPosition) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Posisi tidak ditemukan",
          });
        }

        // Check if position name is being changed and already exists
        if (input.name !== existingPosition.name) {
          const nameExists = await ctx.db.position.findUnique({
            where: { name: input.name },
          });

          if (nameExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Nama posisi sudah terdaftar",
            });
          }
        }

        const updatedPosition = await ctx.db.position.update({
          where: { id: input.id },
          data: {
            name: input.name,
          },
        });

        return {
          success: true,
          message: "Posisi berhasil diupdate",
          data: updatedPosition,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate posisi",
        });
      }
    }),

  // Menghapus data posisi
  deletePosition: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const position = await ctx.db.position.findUnique({
          where: { id: input.id },
        });

        if (!position) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Posisi tidak ditemukan",
          });
        }

        // Check if there are any employments associated with this position
        const relatedEmployments = await ctx.db.employment.count({
          where: { positionId: input.id },
        });

        if (relatedEmployments > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Tidak dapat menghapus posisi yang masih memiliki data employment terkait.",
          });
        }

        await ctx.db.position.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Posisi berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus posisi",
        });
      }
    }),
});
