import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { employeeSchema, employeeSchemaUpdate } from "@/schemas/employeeSchema";
import { TRPCError } from "@trpc/server";

export const employeeRouter = router({
  getAllEmployee: protectedProcedure.query(async ({ ctx }) => {
    const employees = await ctx.db.employee.findMany({
      include: {
        employments: {
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
          employments: {
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

  createFullEmployee: protectedProcedure
    .input(employeeSchema)
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
              phoneNumber: input.phoneNumber,
            },
          });

          // Memproses data employment jika ada
          if (input.employments && input.employments.length > 0) {
            // mengonversi string tanggal kembali ke objek Date
            const employmentDataForPrismaDB = input.employments.map((emp) => {
              // --- Validasi dan Konversi startDate ---
              let startDateObj = null;
              if (typeof emp.startDate === "string" && emp.startDate) {
                const tempDate = new Date(emp.startDate);
                if (!isNaN(tempDate.getTime())) {
                  startDateObj = tempDate;
                } else {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Format startDate tidak valid: ${emp.startDate}`,
                  });
                }
              } else {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `startDate wajib diisi dan dalam format yang benar.`,
                });
              }

              // --- Validasi dan Konversi endDate ---
              let endDateObj = null;
              if (typeof emp.endDate === "string" && emp.endDate) {
                const tempDate = new Date(emp.endDate);
                if (!isNaN(tempDate.getTime())) {
                  endDateObj = tempDate;
                } else {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `endDate wajib diisi dan dalam format yang benar.`,
                  });
                }
              }

              return {
                startDate: startDateObj, // Gunakan objek Date yang sudah dikonversi
                endDate: endDateObj, // Gunakan objek Date yang sudah dikonversi (atau null)
                positionId: emp.positionId,
                employeeId: employee.id, // Gunakan ID karyawan yang baru dibuat
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
    .input(employeeSchemaUpdate)
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
              let startDateObj = null;
              if (typeof emp.startDate === "string" && emp.startDate) {
                const tempDate = new Date(emp.startDate);
                // Periksa apakah hasil konversinya adalah tanggal yang valid (bukan "Invalid Date")
                if (!isNaN(tempDate.getTime())) {
                  startDateObj = tempDate;
                } else {
                  // jika tanggal tidak valid

                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `Format startDate tidak valid: ${emp.startDate}`,
                  });
                }
              } else {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: `startDate wajib diisi dan dalam format yang benar.`,
                });
              }

              // --- Validasi dan Konversi endDate ---
              let endDateObj = null;
              if (typeof emp.endDate === "string" && emp.endDate) {
                const tempDate = new Date(emp.endDate);
                if (!isNaN(tempDate.getTime())) {
                  endDateObj = tempDate;
                } else {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: `endDate wajib diisi dan dalam format yang benar.`,
                  });
                }
              }

              return {
                startDate: startDateObj,
                endDate: endDateObj,
                positionId: emp.positionId,
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
