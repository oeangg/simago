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
        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Check if customer code already exists

          const existingCustomer = await tx.customer.findUnique({
            where: { code: input.code },
          });

          if (existingCustomer) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Kode customer sudah digunakan",
            });
          }

          //cek type npwpDate

          // 2. Create customer
          const customer = await tx.customer.create({
            data: {
              code: input.code,
              name: input.name,
              notes: input.notes,
              npwpNumber: input.npwpNumber,
              npwpName: input.npwpName,
              npwpAddress: input.npwpAddress,
              npwpDate: input.npwpDate,
            },
          });

          // 3. Create addresses
          if (input.addresses && input.addresses.length > 0) {
            const processedAddresses = input.addresses.map((address) => {
              // If country is not Indonesia (ID), clear Indonesian location codes
              if (address.countryCode !== "ID") {
                return {
                  addressType: address.addressType,
                  addressLine1: address.addressLine1,
                  addressLine2: address.addressLine2,
                  zipcode: address.zipcode,
                  isPrimaryAddress: address.isPrimaryAddress,
                  countryCode: address.countryCode,
                  provinceCode: null,
                  regencyCode: null,
                  districtCode: null,
                  customerId: customer.id,
                };
              }

              // For Indonesia, keep the location codes
              return {
                addressType: address.addressType,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                zipcode: address.zipcode,
                isPrimaryAddress: address.isPrimaryAddress,
                countryCode: address.countryCode,
                provinceCode: address.provinceCode,
                regencyCode: address.regencyCode,
                districtCode: address.districtCode,
                customerId: customer.id,
              };
            });

            await tx.customerAddress.createMany({
              data: processedAddresses,
            });
          }

          // 4. Create contacts
          if (input.contacts && input.contacts.length > 0) {
            await tx.customerContact.createMany({
              data: input.contacts.map((contact) => ({
                ...contact,
                customerId: customer.id,
              })),
            });
          }

          // Return complete customer data
          return await tx.customer.findUnique({
            where: { id: customer.id },
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
          message: "Customer berhasil dibuat",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Create customer error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat customer",
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

          // 2. Update customer data if provided
          if (input.code && input.code !== existingCustomer.code) {
            const codeExists = await tx.customer.findUnique({
              where: { code: input.code },
            });

            if (codeExists) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Kode customer sudah digunakan",
              });
            }
          }

          // Update customer basic info
          await tx.customer.update({
            where: { id: input.id },
            data: {
              code: input.code,
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
