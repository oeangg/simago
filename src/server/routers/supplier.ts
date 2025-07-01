import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

import { StatusActive, SupplierType } from "@prisma/client";
import {
  InputSupplierAddressTypeSchema,
  InputSupplierContactTypeSchema,
  supplierSchema,
  supplierUpdateSchema,
} from "@/schemas/supplierSchema";
import { generateCodeAutoNumber } from "@/tools/generateCodeAutoNumber";

const requiredDateSchema = z.string().transform((str) => new Date(str));
const optionalDateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

const supplierInputSchema = supplierSchema.extend({
  activeDate: requiredDateSchema,
  npwpDate: optionalDateSchema,
});

const updateSupplierSchema = supplierUpdateSchema.extend({
  activeDate: requiredDateSchema,
  npwpDate: optionalDateSchema,
});

export const supplierRouter = router({
  createAllSupplier: protectedProcedure
    .input(supplierInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Check if customer code already exists

          const userId = ctx.session?.userId;

          if (!userId) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "User not authenticated",
            });
          }
          const code = await generateCodeAutoNumber({
            db: ctx.db,
            prefix: "SU",
            tableName: "suppliers",
            fieldName: "code",
          });

          const existingSupplier = await tx.supplier.findUnique({
            where: { code: code },
          });

          if (existingSupplier) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Kode supplier sudah digunakan",
            });
          }

          // 2. Create supplier
          const supplier = await tx.supplier.create({
            data: {
              code: code,
              name: input.name,
              supplierType: input.supplierType,
              notes: input.notes,
              npwpNumber: input.npwpNumber,
              npwpName: input.npwpName,
              npwpAddress: input.npwpAddress,
              npwpDate: input.npwpDate,
            },
          });

          // 3. Create addresses
          if (input.addresses && input.addresses.length > 0) {
            await tx.supplierAddress.createMany({
              data: input.addresses.map((address) => ({
                ...address,
                supplierId: supplier.id,
              })),
            });
          }

          // 4. Create contacts
          if (input.contacts && input.contacts.length > 0) {
            await tx.supplierContact.createMany({
              data: input.contacts.map((contact) => ({
                ...contact,
                supplierId: supplier.id,
              })),
            });
          }

          // Return complete supplier data
          return await tx.supplier.findUnique({
            where: { id: supplier.id },
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
          message: "Data supplier berhasil dibuat",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Create supplier error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data supplier",
        });
      }
    }),

  // Update Supplier dengan atomic transaction
  updateAllSupplier: protectedProcedure
    .input(updateSupplierSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Check if customer exists

          const existingSupplier = await tx.supplier.findUnique({
            where: { id: input.id },
            include: {
              addresses: true,
              contacts: true,
            },
          });

          if (!existingSupplier) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Supplier tidak ditemukan",
            });
          }

          //cek type npwpDate

          // Update supplier basic info
          await tx.supplier.update({
            where: { id: input.id },
            data: {
              name: input.name,
              supplierType: input.supplierType,
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
                // Update existing address - hanya update provided fields
                const updateData: Partial<InputSupplierAddressTypeSchema> = {};
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
                if (address.provinceCode !== undefined)
                  updateData.provinceCode = address.provinceCode;
                if (address.regencyCode !== undefined)
                  updateData.regencyCode = address.regencyCode;
                if (address.districtCode !== undefined)
                  updateData.districtCode = address.districtCode;

                await tx.supplierAddress.update({
                  where: { id: address.id },
                  data: updateData,
                });
              } else {
                // Create new jika address msh kosong - cek data wajib diisi sudah tersedia
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

                //jika address kosong create
                await tx.supplierAddress.create({
                  data: {
                    addressType: address.addressType,
                    addressLine1: address.addressLine1,
                    addressLine2: address.addressLine2 || null,
                    zipcode: address.zipcode || null,
                    isPrimaryAddress: address.isPrimaryAddress,
                    countryCode: address.countryCode,
                    provinceCode: address.provinceCode || null,
                    regencyCode: address.regencyCode || null,
                    districtCode: address.districtCode || null,
                    supplierId: input.id,
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
                const updateData: Partial<InputSupplierContactTypeSchema> = {};
                if (contact.contactType !== undefined)
                  updateData.contactType = contact.contactType;
                if (contact.name !== undefined) updateData.name = contact.name;
                if (contact.phoneNumber !== undefined)
                  updateData.phoneNumber = contact.phoneNumber;
                if (contact.email !== undefined)
                  updateData.email = contact.email;
                if (contact.isPrimaryContact !== undefined)
                  updateData.isPrimaryContact = contact.isPrimaryContact;

                await tx.supplierContact.update({
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

                await tx.supplierContact.create({
                  data: {
                    contactType: contact.contactType,
                    name: contact.name,
                    phoneNumber: contact.phoneNumber,
                    email: contact.email || null,
                    isPrimaryContact: contact.isPrimaryContact,
                    supplierId: input.id,
                  },
                });
              }
            }
          }

          // Return updated supplier data
          return await tx.supplier.findUnique({
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
          message: "Data supplier berhasil diperbarui",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Update supplier error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui supplier",
        });
      }
    }),

  // Delete Supplier
  deleteSupplier: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const supplier = await ctx.db.supplier.findUnique({
          where: { id: input.id },
        });

        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Supplier tidak ditemukan",
          });
        }

        await ctx.db.supplier.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "Supplier berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Delete Supplier error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus supplier",
        });
      }
    }),

  // Get Supplier by ID
  getSupplier: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const supplier = await ctx.db.supplier.findUnique({
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

        if (!supplier) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Supplier tidak ditemukan",
          });
        }

        return supplier;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Get supplier error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data supplier",
        });
      }
    }),

  // Get All Suppliers
  getAllSuppliers: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        supplierType: z.nativeEnum(SupplierType).optional(),
        statusActive: z.nativeEnum(StatusActive).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        //params search
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
            input.supplierType ? { supplierType: input.supplierType } : {},
            input.statusActive ? { statusActive: input.statusActive } : {},
          ],
        };

        const [suppliers, total] = await Promise.all([
          ctx.db.supplier.findMany({
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
          ctx.db.supplier.count({ where }),
        ]);

        console.log(suppliers);
        return {
          data: suppliers,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        console.error("Get all suppliers error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data suppliers",
        });
      }
    }),
});
