import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

import { StatusActive, VendorType } from "@prisma/client";
import {
  InputVendorAddressTypeSchema,
  InputVendorBankingTypeSchema,
  InputVendorContactTypeSchema,
  vendorSchema,
  vendorUpdateSchema,
} from "@/schemas/vendorSchema";
import { generateCodeAutoNumber } from "@/tools/generateCodeAutoNumber";

const requiredDateSchema = z.string().transform((str) => new Date(str));
const optionalDateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

const vendorInputSchema = vendorSchema.extend({
  activeDate: requiredDateSchema,
  npwpDate: optionalDateSchema,
});

const updateVendorSchema = vendorUpdateSchema.extend({
  activeDate: requiredDateSchema,
  npwpDate: optionalDateSchema,
});

export const vendorRouter = router({
  createAllVendor: protectedProcedure
    .input(vendorInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.$transaction(
          async (tx) => {
            // 1.  code already exists

            const userId = ctx.session?.userId;

            if (!userId) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "User not authenticated",
              });
            }
            const code = await generateCodeAutoNumber({
              db: ctx.db,
              prefix: "VN",
              tableName: "vendors",
              fieldName: "code",
            });

            const existingVendor = await tx.vendor.findUnique({
              where: { code: code },
            });

            if (existingVendor) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "Kode vendor sudah digunakan",
              });
            }

            //cek type npwpDate

            // 2. Create
            const vendor = await tx.vendor.create({
              data: {
                code,
                name: input.name,
                notes: input.notes,
                picName: input.picName,
                picPosition: input.picPosition,
                npwpNumber: input.npwpNumber,
                npwpName: input.npwpName,
                npwpAddress: input.npwpAddress,
                npwpDate: input.npwpDate,
                paymentTerms: input.paymentTerms,
                vendorType: input.vendorType as VendorType,
              },
            });

            // 3. Create addresses
            if (input.vendorAddresses && input.vendorAddresses.length > 0) {
              const processedAddresses = input.vendorAddresses.map(
                (address) => {
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
                      vendorId: vendor.id,
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
                    vendorId: vendor.id,
                  };
                }
              );

              await tx.vendorAddress.createMany({
                data: processedAddresses,
              });
            }

            // 4. Create contacts
            if (input.vendorContacts && input.vendorContacts.length > 0) {
              await tx.vendorContact.createMany({
                data: input.vendorContacts.map((contact) => ({
                  ...contact,
                  vendorId: vendor.id,
                })),
              });
            }

            // 4. Create bankins
            if (input.vendorBankings && input.vendorBankings.length > 0) {
              await tx.vendorBanking.createMany({
                data: input.vendorBankings.map((banking) => ({
                  ...banking,
                  vendorId: vendor.id,
                })),
              });
            }

            // Return complete  data
            return await tx.vendor.findUnique({
              where: { id: vendor.id },
              include: {
                vendorAddresses: {
                  include: {
                    country: true,
                    province: true,
                    regency: true,
                    district: true,
                  },
                },
                vendorContacts: true,
                vendorBankings: true,
              },
            });
          },
          {
            timeout: 20000,
          }
        );

        return {
          success: true,
          data: result,
          message: "Data vendor berhasil dibuat",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Create driver error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat data driver",
        });
      }
    }),

  // Update  dengan atomic transaction
  updateAllVendor: protectedProcedure
    .input(updateVendorSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.$transaction(
          async (tx) => {
            // 1. Check if  exists

            const existingVendor = await tx.vendor.findUnique({
              where: { id: input.id },
              include: {
                vendorAddresses: true,
                vendorContacts: true,
                vendorBankings: true,
              },
            });

            if (!existingVendor) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Vendor tidak ditemukan",
              });
            }

            // 2. Update  data if provided

            // Update  basic info
            await tx.vendor.update({
              where: { id: input.id },
              data: {
                name: input.name,
                statusActive: input.statusActive,
                activeDate: input.activeDate,
                notes: input.notes,
                picName: input.picName,
                picPosition: input.picPosition,
                npwpNumber: input.npwpNumber,
                npwpName: input.npwpName,
                npwpAddress: input.npwpAddress,
                npwpDate: input.npwpDate,
                paymentTerms: input.paymentTerms,
                vendorType: input.vendorType as VendorType,
              },
            });

            // 3. Update addresses if provided
            if (input.vendorAddresses && input.vendorAddresses.length > 0) {
              for (const address of input.vendorAddresses) {
                if (address.id) {
                  // Update existing address
                  const updateData: Partial<InputVendorAddressTypeSchema> = {};

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

                  await tx.vendorAddress.update({
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

                  await tx.vendorAddress.create({
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
                      vendorId: input.id,
                    },
                  });
                }
              }
            }

            // 4. Update contacts if provided
            if (input.vendorContacts && input.vendorContacts.length > 0) {
              for (const contact of input.vendorContacts) {
                if (contact.id) {
                  // Update existing contact - only update provided fields
                  const updateData: Partial<InputVendorContactTypeSchema> = {};
                  if (contact.contactType !== undefined)
                    updateData.contactType = contact.contactType;
                  if (contact.name !== undefined)
                    updateData.name = contact.name;
                  if (contact.phoneNumber !== undefined)
                    updateData.phoneNumber = contact.phoneNumber;
                  if (contact.faxNumber !== undefined)
                    updateData.faxNumber = contact.faxNumber;
                  if (contact.email !== undefined)
                    updateData.email = contact.email;
                  if (contact.isPrimaryContact !== undefined)
                    updateData.isPrimaryContact = contact.isPrimaryContact;

                  await tx.vendorContact.update({
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

                  await tx.vendorContact.create({
                    data: {
                      contactType: contact.contactType,
                      name: contact.name,
                      phoneNumber: contact.phoneNumber,
                      email: contact.email || null,
                      isPrimaryContact: contact.isPrimaryContact,
                      vendorId: input.id,
                    },
                  });
                }
              }
            }

            // 5. Update banking if provided
            if (input.vendorBankings && input.vendorBankings.length > 0) {
              for (const banking of input.vendorBankings) {
                if (banking.id) {
                  // Update existing contact - only update provided fields
                  const updateData: Partial<InputVendorBankingTypeSchema> = {};
                  if (banking.bankingNumber !== undefined)
                    updateData.bankingNumber = banking.bankingNumber;
                  if (banking.bankingName !== undefined)
                    updateData.bankingName = banking.bankingName;
                  if (banking.bankingBank !== undefined)
                    updateData.bankingBank = banking.bankingBank;
                  if (banking.bankingBranch !== undefined)
                    updateData.bankingBranch = banking.bankingBranch;
                  if (banking.isPrimaryBankingNumber !== undefined)
                    updateData.isPrimaryBankingNumber =
                      banking.isPrimaryBankingNumber;

                  await tx.vendorBanking.update({
                    where: { id: banking.id },
                    data: updateData,
                  });
                } else {
                  // Create new contact - ensure required fields
                  if (
                    !banking.bankingNumber ||
                    !banking.bankingName ||
                    !banking.bankingBank ||
                    banking.isPrimaryBankingNumber === undefined
                  ) {
                    throw new TRPCError({
                      code: "BAD_REQUEST",
                      message:
                        "Data banking tidak lengkap untuk membuat data bank baru",
                    });
                  }

                  await tx.vendorBanking.create({
                    data: {
                      bankingNumber: banking.bankingNumber,
                      bankingName: banking.bankingName,
                      bankingBranch: banking.bankingBranch,
                      bankingBank: banking.bankingBank,
                      isPrimaryBankingNumber: banking.isPrimaryBankingNumber,
                      vendorId: input.id,
                    },
                  });
                }
              }
            }
            // Return updated  data
            return await tx.vendor.findUnique({
              where: { id: input.id },
              include: {
                vendorAddresses: {
                  include: {
                    country: true,
                    province: true,
                    regency: true,
                    district: true,
                  },
                },
                vendorContacts: true,
                vendorBankings: true,
              },
            });
          },
          {
            timeout: 20000,
          }
        );

        return {
          success: true,
          data: result,
          message: "Data bank berhasil diperbarui",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Update bank error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal memperbarui data bank",
        });
      }
    }),

  // Delete
  deleteVendor: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const vendor = await ctx.db.vendor.findUnique({
          where: { id: input.id },
        });

        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor tidak ditemukan",
          });
        }

        await ctx.db.vendor.delete({
          where: { id: input.id },
        });

        return {
          success: true,
          message: "data vendor berhasil dihapus",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Delete Vendor error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal menghapus vendor",
        });
      }
    }),

  // Get  by ID
  getVendorById: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        const vendor = await ctx.db.vendor.findUnique({
          where: { id: input.id },
          include: {
            vendorAddresses: {
              include: {
                country: true,
                province: true,
                regency: true,
                district: true,
              },
            },
            vendorContacts: true,
            vendorBankings: true,
          },
        });

        if (!vendor) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vendor tidak ditemukan",
          });
        }

        return vendor;
      } catch (error) {
        if (error instanceof TRPCError) throw error;

        console.error("Get vendor error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data vendor",
        });
      }
    }),

  // Get All
  getAllVendors: protectedProcedure
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(10),
        search: z.string().optional(),
        vendorType: z.nativeEnum(VendorType).optional(),
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
            input.vendorType ? { vendorType: input.vendorType } : {},
            input.statusActive ? { statusActive: input.statusActive } : {},
          ],
        };

        const [drivers, total] = await Promise.all([
          ctx.db.vendor.findMany({
            where,
            skip: (input.page - 1) * input.limit,
            take: input.limit,

            include: {
              vendorAddresses: {
                where: { isPrimaryAddress: true },
                include: {
                  country: true,
                  province: true,
                  regency: true,
                  district: true,
                },
              },
              vendorContacts: {
                where: { isPrimaryContact: true },
              },
              vendorBankings: {
                where: { isPrimaryBankingNumber: true },
              },
            },
            orderBy: { createdAt: "desc" },
          }),
          ctx.db.vendor.count({ where }),
        ]);

        console.log(drivers);
        return {
          data: drivers,
          total,
          page: input.page,
          totalPages: Math.ceil(total / input.limit),
        };
      } catch (error) {
        console.error("Get all drivers error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengambil data drivers",
        });
      }
    }),
});
