import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  inputEmployeeRouterSchema,
  updateEmployeeRouterSchema,
} from "@/schemas/employeeSchema";
import { TRPCError } from "@trpc/server";
import { Gender, Prisma } from "@prisma/client";

export const employeeRouter = router({
  getAllEmployee: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        gender: z.array(z.nativeEnum(Gender)).optional(),
        isActive: z.boolean().optional(),
        sortBy: z.enum(["name", "nik", "city", "createdAt"]).default("name"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
        activeMonth: z.number().min(1).max(12).optional(),
        activeYear: z.number().min(1900).max(2100).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page = 1,
        limit = 10,
        search,
        gender,
        isActive,
        sortBy = "name",
        sortOrder = "asc",
        activeMonth,
        activeYear,
      } = input;

      const skip = (page - 1) * limit;

      // Build where clause
      const where: Prisma.EmployeeWhereInput = {};

      // Search filter
      if (search) {
        where.OR = [
          { nik: { contains: search, mode: "insensitive" } },
          { name: { contains: search, mode: "insensitive" } },
          { city: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search, mode: "insensitive" } },
          {
            employments: {
              some: {
                division: {
                  name: { contains: search, mode: "insensitive" },
                },
              },
            },
          },
        ];
      }

      // Gender filter
      if (gender && gender.length > 0) {
        where.gender = { in: gender };
      }

      // Active status filter
      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Active date filter (based on employment startDate)
      if (activeMonth || activeYear) {
        const dateFilters: Prisma.EmploymentWhereInput = {};

        if (activeYear && activeMonth) {
          // Filter by specific month and year
          const startDate = new Date(activeYear, activeMonth - 1, 1);
          const endDate = new Date(activeYear, activeMonth, 0, 23, 59, 59, 999);

          dateFilters.startDate = {
            gte: startDate.toISOString(),
            lte: endDate.toISOString(),
          };
        } else if (activeYear) {
          // Filter by year only
          const startDate = new Date(activeYear, 0, 1);
          const endDate = new Date(activeYear, 11, 31, 23, 59, 59, 999);

          dateFilters.startDate = {
            gte: startDate.toISOString(),
            lte: endDate.toISOString(),
          };
        } else if (activeMonth) {
          // Filter by month only (current year)
          const currentYear = new Date().getFullYear();
          const startDate = new Date(currentYear, activeMonth - 1, 1);
          const endDate = new Date(
            currentYear,
            activeMonth,
            0,
            23,
            59,
            59,
            999
          );

          dateFilters.startDate = {
            gte: startDate.toISOString(),
            lte: endDate.toISOString(),
          };
        }

        where.employments = {
          some: dateFilters,
        };
      }

      // Execute queries
      const [employees, total] = await Promise.all([
        ctx.db.employee.findMany({
          where,
          include: {
            employments: {
              include: {
                position: true,
                division: true,
              },
              orderBy: {
                startDate: "desc",
              },
            },
          },
          orderBy: {
            [sortBy]: sortOrder,
          },
          skip,
          take: limit,
        }),
        ctx.db.employee.count({ where }),
      ]);

      return {
        data: employees,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
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
          employments: {
            include: {
              position: true,
              division: true,
            },
            orderBy: {
              startDate: "desc",
            },
          },
        },
      });

      if (!employeeById) {
        throw new Error("Employee tidak ditemukan");
      }

      return employeeById;
    }),

  createFullEmployee: protectedProcedure
    .input(inputEmployeeRouterSchema)
    .mutation(async ({ ctx, input }) => {
      // console.log("Input received:", JSON.stringify(input, null, 2));
      try {
        const existingEmployee = await ctx.db.employee.findUnique({
          where: { nik: input.nik.toUpperCase() },
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
              nik: input.nik.toUpperCase(),
              name: input.name,
              isActive: input.isActive,
              activeDate: input.activeDate,
              resignDate: input.resignDate,
              gender: input.gender,
              address: input.address,
              city: input.city,
              zipcode: input.zipcode,
              photo: input.photo || null,
              ttdDigital: input.ttdDigital || null,
              phoneNumber: input.phoneNumber,
            },
          });

          // Memproses data employment jika ada
          if (input.employments && input.employments.length > 0) {
            // mengonversi string tanggal kembali ke objek Date
            const employmentDataForPrismaDB = input.employments.map((emp) => {
              // --- Validasi dan Konversi startDate ---

              return {
                startDate: emp.startDate,
                endDate: emp.endDate,
                positionId: emp.positionId,
                divisionId: emp.divisionId,
                employeeId: employee.id,
              };
            });

            await prisma.employment.createMany({
              data: employmentDataForPrismaDB,
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

  updateFullEmployee: protectedProcedure
    .input(updateEmployeeRouterSchema)
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

        const result = await ctx.db.$transaction(async (prisma) => {
          // Update employee data
          const employee = await prisma.employee.update({
            where: { id: input.id },
            data: {
              // nik: input.nik,
              name: input.name,
              isActive: input.isActive,
              activeDate: input.activeDate,
              resignDate: input.resignDate,
              gender: input.gender,
              address: input.address,
              city: input.city,
              zipcode: input.zipcode,
              photo: input.photo || null,
              ttdDigital: input.ttdDigital || null,
              phoneNumber: input.phoneNumber,
            },
          });

          // Delete existing employment records
          await prisma.employment.deleteMany({
            where: { employeeId: input.id },
          });

          // Memproses data employment jika ada
          if (input.employments && input.employments.length > 0) {
            // mengonversi string tanggal kembali ke objek Date
            const employmentDataForPrismaDB = input.employments.map((emp) => {
              // --- Validasi dan Konversi startDate ---

              return {
                startDate: emp.startDate,
                endDate: emp.endDate,
                positionId: emp.positionId,
                divisionId: emp.divisionId,
                employeeId: employee.id,
              };
            });

            await prisma.employment.createMany({
              data: employmentDataForPrismaDB,
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
