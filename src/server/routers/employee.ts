import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  EmployeeFormSchema,
  EmployeeFormSchemaUpdate,
} from "@/schemas/employee-schema";
import { TRPCError } from "@trpc/server";

function isPrismaError(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

export const employeeRouter = router({
  getAllEmployee: protectedProcedure.query(async ({ ctx }) => {
    const employees = await ctx.db.employee.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return employees;
  }),

  getEmployeebyId: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const employeeById = await ctx.db.employee.findFirst({
        where: {
          id: input.id,
        },
      });

      return employeeById;
    }),

  createEmployee: protectedProcedure
    .input(EmployeeFormSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const employee = await ctx.db.employee.create({
          data: input,
        });

        return {
          data: employee,
          message: "Berhasil menambah data karyawan!",
        };
      } catch (error) {
        if (isPrismaError(error) && error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Data sudah ada! NIK atau informasi lain sudah terdaftar.",
          });
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal menambah data karyawan!",
          });
        }
      }
    }),

  updateEmployee: protectedProcedure
    .input(EmployeeFormSchemaUpdate)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;
        const employee = await ctx.db.employee.update({
          where: {
            id,
          },
          data,
        });

        return {
          data: employee,
          message: "Berhasil mengupdate data karyawan!",
        };
      } catch (error) {
        if (isPrismaError(error) && error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Data sudah ada! NIK atau informasi lain sudah terdaftar.",
          });
        } else {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Gagal mengupdate data karyawan!",
          });
        }
      }
    }),

  deleteEmployee: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await ctx.db.employee.delete({
          where: { id: input.id },
        });
        return { message: "Berhasil menghapus data karyawan!" };
      } catch {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gagal menghapus data karyawan",
        });
      }
    }),
});
