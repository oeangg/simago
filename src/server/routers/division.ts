import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { divisonSchema } from "@/schemas/employeeSchema"; // Sesuaikan path jika berbeda
import { TRPCError } from "@trpc/server";

export const divisionRouter = router({
  // Mendapatkan semua data divisi
  getAllDivision: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.division.findMany({
      orderBy: {
        name: "asc",
      },
    });
  }),

  // Mendapatkan data divsi berdasarkan ID
  getDivisionById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return await ctx.db.division.findUnique({
        where: { id: input.id },
      });
    }),

  // Membuat data posisi baru
  createDivision: protectedProcedure
    .input(divisonSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const existingDivison = await ctx.db.division.findUnique({
          where: { name: input.name.toUpperCase() },
        });

        if (existingDivison) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Nama divisi sudah terdaftar!",
          });
        }

        const newDivision = await ctx.db.division.create({
          data: {
            name: input.name.toUpperCase(),
          },
        });
        return {
          message: "Divisi berhasil ditambahkan",
          data: newDivision,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan divisi",
        });
      }
    }),

  updateDivision: protectedProcedure
    .input(divisonSchema.extend({ id: z.string() })) // Menambahkan ID untuk update
    .mutation(async ({ ctx, input }) => {
      try {
        const existingDivision = await ctx.db.division.findUnique({
          where: { id: input.id },
        });

        if (!existingDivision) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Divisi tidak ditemukan",
          });
        }

        // Check if position name is being changed and already exists
        if (input.name !== existingDivision.name) {
          const nameExists = await ctx.db.division.findUnique({
            where: { name: input.name },
          });

          if (nameExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Nama posisi sudah terdaftar",
            });
          }
        }

        const updatedDivision = await ctx.db.division.update({
          where: { id: input.id },
          data: {
            name: input.name,
          },
        });

        return {
          success: true,
          message: "Posisi berhasil diupdate",
          data: updatedDivision,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate divisi",
        });
      }
    }),

  // Menghapus data divisi
  deleteDivision: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const division = await ctx.db.division.findUnique({
          where: { id: input.id },
        });

        if (!division) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Divisi tidak ditemukan",
          });
        }

        // Check if there are any employments associated with this position
        const relatedEmployments = await ctx.db.employment.count({
          where: { divisionId: input.id },
        });

        if (relatedEmployments > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Tidak dapat menghapus divisi yang masih memiliki data employment terkait.",
          });
        }

        await ctx.db.division.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Divisi berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus divisi",
        });
      }
    }),
});
