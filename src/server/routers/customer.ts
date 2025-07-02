import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

import {
  customerSchema,
  customerUpdateSchema,
  InputAddressTypeSchema,
  InputContactTypeSchema,
} from "@/schemas/customerSchema";
import { StatusActive } from "@prisma/client";
import { generateCodeAutoNumber } from "@/tools/generateCodeAutoNumber";

const requiredDateSchema = z.string().transform((str) => new Date(str));
const optionalDateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

const InputCustomerSchema = customerSchema.extend({
  activeDate: requiredDateSchema,
  npwpDate: optionalDateSchema,
});

const UpdateCustomerSchema = customerUpdateSchema.extend({
  activeDate: requiredDateSchema,
  npwpDate: optionalDateSchema,
});

export const customerRouter = router({
  // Create Customer dengan atomic transaction
  createAllCustomer: protectedProcedure
    .input(InputCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("Starting customer creation:", {
          userId: ctx.session?.userId,
        });

        const result = await ctx.db.$transaction(async (tx) => {
          const userId = ctx.session?.userId;
          if (!userId) {
            console.log("User not authenticated");
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            });
          }

          console.log("Generating customer code...");
          const code = await generateCodeAutoNumber({
            db: ctx.db,
            prefix: "CU",
            tableName: "customers",
            fieldName: "code",
          });
          console.log("Generated code:", code);

          console.log("Checking existing customer...");
          const existingCustomer = await tx.customer.findUnique({
            where: { code: code },
          });

          if (existingCustomer) {
            console.log("Customer code already exists:", code);
            throw new TRPCError({
              code: "CONFLICT",
              message: "Kode customer sudah digunakan",
            });
          }

          console.log("Creating customer...");
          const customer = await tx.customer.create({
            data: {
              code,
              name: input.name,
              notes: input.notes,
              npwpNumber: input.npwpNumber,
              npwpName: input.npwpName,
              npwpAddress: input.npwpAddress,
              npwpDate: input.npwpDate,
            },
          });
          console.log("Customer created:", customer.id);

          // ... rest of the code with more logging
        });

        return {
          success: true,
          data: result,
          message: "Customer berhasil dibuat",
        };
      } catch (error) {
        console.error("Create customer error details:", {
          error: error,
          message:
            error instanceof Error ? error.message : "Unknown error message",
          stack:
            error instanceof Error ? error.stack : "No stack trace available",
          name: error instanceof Error ? error.name : "Unknown error name",
        });

        if (error instanceof TRPCError) throw error;

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat customer",
          cause: error, // Tambahkan cause untuk debugging
        });
      }
    }),

  // Update Customer dengan atomic transaction
  updateAllCustomer: protectedProcedure
    .input(UpdateCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Check if customer exists

          const existingCustomer = await tx.customer.findUnique({
            where: { id: input.id },
            include: {
              addresses: true,
              contacts: true,
            },
          });

          if (!existingCustomer) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Customer tidak ditemukan",
            });
          }

          // Update customer basic info
          await tx.customer.update({
            where: { id: input.id },
            data: {
              name: input.name,
              statusActive: input.statusActive,
              notes: input.notes,
              npwpNumber: input.npwpNumber,
              npwpName: input.npwpName,
              npwpAddress: input.npwpAddress,
              npwpDate: input.npwpDate,
            },
          });

          // 3. Update addresses if provided
          if (input.addresses && input.addresses.length > 0) {
            for (const address of input.addresses) {
              if (address.id) {
                // Update existing address
                const updateData: Partial<InputAddressTypeSchema> = {};

                if (address.addressType !== undefined)
                  updateData.addressType = address.addressType;
                if (address.addressLine1 !== undefined)
                  updateData.addressLine1 = address.addressLine1;
                if (address.addressLine2 !== undefined)
                  updateData.addressLine2 = address.addressLine2;
                if (address.zipcode !== undefined)
                  updateData.zipcode = address.zipcode;
                if (address.isPrimaryAddress !== undefined)
                  updateData.isPrimaryAddress = address.isPrimaryAddress;
                if (address.countryCode !== undefined)
                  updateData.countryCode = address.countryCode;

                // Handle location codes based on country - with proper type handling
                if (address.countryCode === "ID") {
                  // For Indonesia, use the provided values or undefined
                  if (address.provinceCode !== undefined)
                    updateData.provinceCode = address.provinceCode;
                  if (address.regencyCode !== undefined)
                    updateData.regencyCode = address.regencyCode;
                  if (address.districtCode !== undefined)
                    updateData.districtCode = address.districtCode;
                } else if (address.countryCode !== undefined) {
                  // For non-Indonesia, explicitly set to undefined (not null)
                  updateData.provinceCode = undefined;
                  updateData.regencyCode = undefined;
                  updateData.districtCode = undefined;
                }

                await tx.customerAddress.update({
                  where: { id: address.id },
                  data: updateData,
                });
              } else {
                // Create new address
                if (
                  !address.addressType ||
                  !address.addressLine1 ||
                  !address.countryCode ||
                  address.isPrimaryAddress === undefined
                ) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                      "Data alamat tidak lengkap untuk membuat alamat baru",
                  });
                }

                await tx.customerAddress.create({
                  data: {
                    addressType: address.addressType,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 || null,
                    zipcode: address.zipcode || null,
                    isPrimaryAddress: address.isPrimaryAddress,
                    countryCode: address.countryCode,
                    provinceCode:
                      address.countryCode === "ID"
                        ? address.provinceCode || null
                        : null,
                    regencyCode:
                      address.countryCode === "ID"
                        ? address.regencyCode || null
                        : null,
                    districtCode:
                      address.countryCode === "ID"
                        ? address.districtCode || null
                        : null,
                    customerId: input.id,
                  },
                });
              }
            }
          }

          // 4. Update contacts if provided
          if (input.contacts && input.contacts.length > 0) {
            for (const contact of input.contacts) {
              if (contact.id) {
                // Update existing contact - only update provided fields
                const updateData: Partial<InputContactTypeSchema> = {};
                if (contact.contactType !== undefined)
                  updateData.contactType = contact.contactType;
                if (contact.name !== undefined) updateData.name = contact.name;
                if (contact.phoneNumber !== undefined)
                  updateData.phoneNumber = contact.phoneNumber;
                if (contact.email !== undefined)
                  updateData.email = contact.email;
                if (contact.isPrimaryContact !== undefined)
                  updateData.isPrimaryContact = contact.isPrimaryContact;

                await tx.customerContact.update({
                  where: { id: contact.id },
                  data: updateData,
                });
              } else {
                // Create new contact - ensure required fields
                if (
                  !contact.contactType ||
                  !contact.name ||
                  !contact.phoneNumber ||
                  contact.isPrimaryContact === undefined
                ) {
                  throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                      "Data kontak tidak lengkap untuk membuat kontak baru",
                  });
                }

                await tx.customerContact.create({
                  data: {
                    contactType: contact.contactType,
                    name: contact.name,
                    phoneNumber: contact.phoneNumber,
                    email: contact.email || null,
                    isPrimaryContact: contact.isPrimaryContact,
                    customerId: input.id,
                  },
                });
              }
            }
          }

          // Return updated customer data
          return await tx.customer.findUnique({
            where: { id: input.id },
            include: {
              addresses: {
                include: {
                  country: true,
                  province: true,
                  regency: true,
                  district: true,
                },
              },
              contacts: true,
            },
          });
        });

        return {
          success: true,
          data: result,
          message: "Customer berhasil diperbarui",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Update customer error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui customer",
        });
      }
    }),

  // Delete Customer
  deleteCustomer: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const customer = await ctx.db.customer.findUnique({
          where: { id: input.id },
        });

        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer tidak ditemukan",
          });
        }

        await ctx.db.customer.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Customer berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Delete customer error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus customer",
        });
      }
    }),

  // Get Customer by ID
  getCustomer: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const customer = await ctx.db.customer.findUnique({
          where: { id: input.id },
          include: {
            addresses: {
              include: {
                country: true,
                province: true,
                regency: true,
                district: true,
              },
            },
            contacts: true,
          },
        });

        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer tidak ditemukan",
          });
        }

        return customer;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Get customer error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data customer",
        });
      }
    }),

  // Get All Customers
  getAllCustomers: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        statusActive: z.nativeEnum(StatusActive).optional(),
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

        const [customers, total] = await Promise.all([
          ctx.db.customer.findMany({
            where,
            skip: (input.page - 1) * input.limit,
            take: input.limit,

            include: {
              addresses: {
                where: { isPrimaryAddress: true },
                include: {
                  country: true,
                  province: true,
                  regency: true,
                  district: true,
                },
              },
              contacts: {
                where: { isPrimaryContact: true },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          ctx.db.customer.count({ where }),
        ]);

        console.log(customers);
        return {
          data: customers,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        console.error("Get all customers error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data customers",
        });
      }
    }),
});
