import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { employmentSchema } from "@/schemas/employeeSchema"; // Sesuaikan path jika berbeda
import { TRPCError } from "@trpc/server";

export const employmentRouter = router({
  getAllEmployment: protectedProcedure.query(async ({ ctx }) => {
    const employments = await ctx.db.employment.findMany({
      include: {
        employee: true,
        position: true,
      },
      orderBy: {
        startDate: "desc",
      },
    });
    return employments;
  }),

  getEmploymentById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const employmentById = await ctx.db.employment.findFirst({
        where: { id: input.id },
        include: {
          employee: true,
          position: true,
        },
      });
      return employmentById;
    }),

  // Membuat data employment baru
  createEmployment: protectedProcedure
    .input(employmentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const newEmployment = await ctx.db.employment.create({
          data: {
            startDate: input.startDate,
            endDate: input.endDate || null,
            positionId: input.positionId,
            divisionId: input.divisionId,
            employeeId: input.employeeId!, // Pastikan employeeId ada saat membuat employment
          },
        });
        return {
          message: "Data employment berhasil ditambahkan",
          data: newEmployment,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan employment",
        });
      }
    }),

  // Mengupdate data employment
  updateEmployment: protectedProcedure
    .input(employmentSchema.extend({ id: z.string() })) // Menambahkan ID untuk update
    .mutation(async ({ ctx, input }) => {
      try {
        const existingEmployment = await ctx.db.employment.findUnique({
          where: { id: input.id },
        });

        if (!existingEmployment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employment tidak ditemukan",
          });
        }

        const updatedEmployment = await ctx.db.employment.update({
          where: { id: input.id },
          data: {
            startDate: input.startDate,
            endDate: input.endDate || null,
            positionId: input.positionId,
            employeeId: input.employeeId!,
          },
        });

        return {
          success: true,
          message: "Data employment berhasil diupdate",
          data: updatedEmployment,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate employment",
        });
      }
    }),

  // Menghapus data employment
  deleteEmployment: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const employment = await ctx.db.employment.findUnique({
          where: { id: input.id },
        });

        if (!employment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Employment tidak ditemukan",
          });
        }

        await ctx.db.employment.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Data employment berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus employment",
        });
      }
    }),
});
