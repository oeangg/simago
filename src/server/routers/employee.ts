import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  EmployeeFormSchema,
  EmployeeFormSchemaUpdate,
} from "@/schemas/employee-schema";
import { TRPCError } from "@trpc/server";

export const employeeRouter = router({
  getAllEmployee: protectedProcedure.query(async ({ ctx }) => {
    const employees = await ctx.db.employee.findMany({
      include: {
        employment: {
          include: {
            position: true,
          },
          orderBy: {
            startDate: "desc",
          },
        },
      },
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
        where: { id: input.id },
        include: {
          employment: {
            include: {
              position: true,
            },
            orderBy: {
              startDate: "desc",
            },
          },
        },
      });

      return employeeById;
    }),

  createEmployee: protectedProcedure
    .input(EmployeeFormSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const existingEmployee = await ctx.db.employee.findUnique({
          where: { nik: input.nik },
        });

        if (existingEmployee) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "NIK sudah terdaftar!",
          });
        }

        const result = await ctx.db.$transaction(async (prisma) => {
          // Create employee
          const employee = await prisma.employee.create({
            data: {
              nik: input.nik,
              name: input.name,
              isActive: input.isActive,
              gender: input.gender,
              address: input.address,
              city: input.city,
              zipcode: input.zipcode,
              photo: input.photo || null,
              telNumber: input.telNumber || null,
              phoneNumber: input.phoneNumber,
            },
          });

          if (input.employment && input.employment.length > 0) {
            await prisma.employment.createMany({
              data: input.employment.map((emp) => ({
                startDate: emp.startDate,
                endDate: emp.endDate || null,
                positionId: emp.positionId,
                employeeId: employee.id,
              })),
            });
          }

          return employee;
        });

        return {
          message: "Data karyawan berhasil ditambahkan",
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menambahkan karyawan",
        });
      }
    }),

  updateEmployee: protectedProcedure
    .input(EmployeeFormSchemaUpdate)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if employee exists
        const existingEmployee = await ctx.db.employee.findUnique({
          where: { id: input.id },
        });

        if (!existingEmployee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Karyawan tidak ditemukan",
          });
        }

        // Check if NIK is being changed and already exists
        if (input.nik !== existingEmployee.nik) {
          const nikExists = await ctx.db.employee.findUnique({
            where: { nik: input.nik },
          });

          if (nikExists) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "NIK sudah terdaftar",
            });
          }
        }

        // Update employee with employment data using transaction
        const result = await ctx.db.$transaction(async (prisma) => {
          // Update employee data
          const employee = await prisma.employee.update({
            where: { id: input.id },
            data: {
              nik: input.nik,
              name: input.name,
              isActive: input.isActive,
              gender: input.gender,
              address: input.address,
              city: input.city,
              zipcode: input.zipcode,
              photo: input.photo || null,
              telNumber: input.telNumber || null,
              phoneNumber: input.phoneNumber,
            },
          });

          // Delete existing employment records
          await prisma.employment.deleteMany({
            where: { employeeId: input.id },
          });

          // Create new employment records if provided
          if (input.employment && input.employment.length > 0) {
            await prisma.employment.createMany({
              data: input.employment.map((emp) => ({
                startDate: emp.startDate,
                endDate: emp.endDate || null,
                positionId: emp.positionId,
                employeeId: employee.id,
              })),
            });
          }

          return employee;
        });

        return {
          success: true,
          message: "Karyawan berhasil diupdate",
          data: result,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate karyawan",
        });
      }
    }),

  deleteEmployee: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const employee = await ctx.db.employee.findUnique({
          where: { id: input.id },
        });

        if (!employee) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Karyawan tidak ditemukan",
          });
        }

        // Delete employee (employment records will be deleted by cascade)
        await ctx.db.employee.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Karyawan berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus karyawan",
        });
      }
    }),
});
