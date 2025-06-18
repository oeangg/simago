import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { protectedProcedure, router } from "../trpc";
import {
  createFullCustomerSchema,
  updateFullCustomerSchema,
} from "@/schemas/customerSchema";

export const customerRouter = router({
  // Create Full Customer (Atomic Transaction)
  createFullCustomer: protectedProcedure
    .input(createFullCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const { customer, addresses, contacts, npwpInfo } = input;

      try {
        const result = await ctx.db.$transaction(async (tx) => {
          // 1. Create Customer
          const newCustomer = await tx.customer.create({
            data: {
              code: customer.code,
              name: customer.name,
              customerType: customer.customerType,
              notes: customer.notes,
            },
          });

          // 2. Create Addresses
          const createdAddresses = await Promise.all(
            addresses.map((address) =>
              tx.customerAddress.create({
                data: {
                  ...address,
                  customerId: newCustomer.id,
                },
              })
            )
          );

          // 3. Create Contacts
          const createdContacts = await Promise.all(
            contacts.map((contact) =>
              tx.customerContact.create({
                data: {
                  ...contact,
                  customerId: newCustomer.id,
                },
              })
            )
          );

          // 4. Create NPWP (if provided)
          let createdNpwp = null;
          if (npwpInfo) {
            createdNpwp = await tx.customerNpwp.create({
              data: {
                ...npwpInfo,
                customerId: newCustomer.id,
              },
            });
          }

          return {
            customer: newCustomer,
            addresses: createdAddresses,
            contacts: createdContacts,
            npwpInfo: createdNpwp,
          };
        });

        return result;
      } catch (error) {
        console.error("Error creating full customer:", error);

        // Handle unique constraint violations
        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle unique constraint violations
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes("code")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Kode customer sudah digunakan",
            });
          }

          if (target?.includes("OnePrimaryAddressPerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Hanya boleh ada satu alamat utama per customer",
            });
          }
          if (target?.includes("OneAddressTypePerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Tipe alamat sudah ada untuk customer ini",
            });
          }
          if (target?.includes("OnePrimaryContactPerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Hanya boleh ada satu kontak utama per customer",
            });
          }
          if (target?.includes("OneContactTypePerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Tipe kontak sudah ada untuk customer ini",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal membuat customer",
        });
      }
    }),

  // Update Full Customer (Atomic Transaction)
  updateFullCustomer: protectedProcedure
    .input(updateFullCustomerSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, customer, addresses, contacts, npwpInfo } = input;

      try {
        // Check if customer exists
        const existingCustomer = await ctx.db.customer.findUnique({
          where: { id },
          include: {
            addresses: true,
            contacts: true,
            npwpInfo: true,
          },
        });

        if (!existingCustomer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer tidak ditemukan",
          });
        }

        const result = await ctx.db.$transaction(async (tx) => {
          let updatedCustomer = existingCustomer;

          // 1. Update Customer basic info
          if (customer) {
            updatedCustomer = await tx.customer.update({
              where: { id },
              data: customer,
              include: {
                addresses: true,
                contacts: true,
                npwpInfo: true,
              },
            });
          }

          // 2. Update Addresses
          let updatedAddresses = existingCustomer.addresses;
          if (addresses && addresses.length > 0) {
            updatedAddresses = await Promise.all(
              addresses.map(async (addressInput) => {
                const { id: addressId, ...addressData } = addressInput;

                if (addressId) {
                  // Update existing address
                  return await tx.customerAddress.update({
                    where: { id: addressId },
                    data: addressData,
                  });
                } else {
                  // Create new address or update by criteria
                  const existingAddress = await tx.customerAddress.findFirst({
                    where: {
                      customerId: id,
                      OR: [
                        ...(addressInput.isPrimaryAddress !== undefined
                          ? [
                              {
                                isPrimaryAddress: addressInput.isPrimaryAddress,
                              },
                            ]
                          : []),
                        ...(addressInput.addressType !== undefined
                          ? [{ addressType: addressInput.addressType }]
                          : []),
                      ],
                    },
                  });

                  if (existingAddress) {
                    return await tx.customerAddress.update({
                      where: { id: existingAddress.id },
                      data: {
                        ...addressData,
                        // Filter out undefined values
                        ...(addressData.addressType !== undefined && {
                          addressType: addressData.addressType,
                        }),
                        ...(addressData.addressLine1 !== undefined && {
                          addressLine1: addressData.addressLine1,
                        }),
                        ...(addressData.addressLine2 !== undefined && {
                          addressLine2: addressData.addressLine2,
                        }),
                        ...(addressData.zipcode !== undefined && {
                          zipcode: addressData.zipcode,
                        }),
                        ...(addressData.isPrimaryAddress !== undefined && {
                          isPrimaryAddress: addressData.isPrimaryAddress,
                        }),
                        ...(addressData.countryId !== undefined && {
                          countryId: addressData.countryId,
                        }),
                        ...(addressData.provinceId !== undefined && {
                          provinceId: addressData.provinceId,
                        }),
                        ...(addressData.cityId !== undefined && {
                          cityId: addressData.cityId,
                        }),
                      },
                    });
                  } else {
                    // For creating new address, we need all required fields
                    if (
                      !addressData.addressType ||
                      !addressData.addressLine1 ||
                      !addressData.countryId ||
                      addressData.isPrimaryAddress === undefined
                    ) {
                      throw new TRPCError({
                        code: "BAD_REQUEST",
                        message:
                          "Field wajib tidak lengkap untuk membuat alamat baru",
                      });
                    }

                    return await tx.customerAddress.create({
                      data: {
                        addressType: addressData.addressType,
                        addressLine1: addressData.addressLine1,
                        addressLine2: addressData.addressLine2,
                        zipcode: addressData.zipcode,
                        isPrimaryAddress: addressData.isPrimaryAddress,
                        countryId: addressData.countryId,
                        provinceId: addressData.provinceId,
                        cityId: addressData.cityId,
                        customerId: id,
                      },
                    });
                  }
                }
              })
            );
          }

          // 3. Update Contacts
          let updatedContacts = existingCustomer.contacts;
          if (contacts && contacts.length > 0) {
            updatedContacts = await Promise.all(
              contacts.map(async (contactInput) => {
                const { id: contactId, ...contactData } = contactInput;

                if (contactId) {
                  // Update existing contact
                  return await tx.customerContact.update({
                    where: { id: contactId },
                    data: contactData,
                  });
                } else {
                  // Create new contact or update by criteria
                  const existingContact = await tx.customerContact.findFirst({
                    where: {
                      customerId: id,
                      OR: [
                        ...(contactInput.isPrimaryContact !== undefined
                          ? [
                              {
                                isPrimaryContact: contactInput.isPrimaryContact,
                              },
                            ]
                          : []),
                        ...(contactInput.contactType !== undefined
                          ? [{ contactType: contactInput.contactType }]
                          : []),
                      ],
                    },
                  });

                  if (existingContact) {
                    return await tx.customerContact.update({
                      where: { id: existingContact.id },
                      data: {
                        // Filter out undefined values
                        ...(contactData.contactType !== undefined && {
                          contactType: contactData.contactType,
                        }),
                        ...(contactData.name !== undefined && {
                          name: contactData.name,
                        }),
                        ...(contactData.phoneNumber !== undefined && {
                          phoneNumber: contactData.phoneNumber,
                        }),
                        ...(contactData.email !== undefined && {
                          email: contactData.email,
                        }),
                        ...(contactData.isPrimaryContact !== undefined && {
                          isPrimaryContact: contactData.isPrimaryContact,
                        }),
                      },
                    });
                  } else {
                    // For creating new contact, we need all required fields
                    if (
                      !contactData.contactType ||
                      !contactData.name ||
                      !contactData.phoneNumber ||
                      contactData.isPrimaryContact === undefined
                    ) {
                      throw new TRPCError({
                        code: "BAD_REQUEST",
                        message:
                          "Field wajib tidak lengkap untuk membuat kontak baru",
                      });
                    }

                    return await tx.customerContact.create({
                      data: {
                        contactType: contactData.contactType,
                        name: contactData.name,
                        phoneNumber: contactData.phoneNumber,
                        email: contactData.email,
                        isPrimaryContact: contactData.isPrimaryContact,
                        customerId: id,
                      },
                    });
                  }
                }
              })
            );
          }

          // 4. Update NPWP
          let updatedNpwp = existingCustomer.npwpInfo;
          if (npwpInfo) {
            if (existingCustomer.npwpInfo) {
              // Update existing NPWP - filter out undefined values
              updatedNpwp = await tx.customerNpwp.update({
                where: { customerId: id },
                data: {
                  ...(npwpInfo.npwpNumber !== undefined && {
                    npwpNumber: npwpInfo.npwpNumber,
                  }),
                  ...(npwpInfo.npwpName !== undefined && {
                    npwpName: npwpInfo.npwpName,
                  }),
                  ...(npwpInfo.npwpAddress !== undefined && {
                    npwpAddress: npwpInfo.npwpAddress,
                  }),
                  ...(npwpInfo.npwpDate !== undefined && {
                    npwpDate: npwpInfo.npwpDate,
                  }),
                },
              });
            } else {
              // Create new NPWP - need all required fields
              if (
                !npwpInfo.npwpNumber ||
                !npwpInfo.npwpName ||
                !npwpInfo.npwpAddress ||
                !npwpInfo.npwpDate
              ) {
                throw new TRPCError({
                  code: "BAD_REQUEST",
                  message: "Field wajib tidak lengkap untuk membuat NPWP baru",
                });
              }

              updatedNpwp = await tx.customerNpwp.create({
                data: {
                  npwpNumber: npwpInfo.npwpNumber,
                  npwpName: npwpInfo.npwpName,
                  npwpAddress: npwpInfo.npwpAddress,
                  npwpDate: npwpInfo.npwpDate,
                  customerId: id,
                },
              });
            }
          }

          return {
            customer: updatedCustomer,
            addresses: updatedAddresses,
            contacts: updatedContacts,
            npwpInfo: updatedNpwp,
          };
        });

        return result;
      } catch (error) {
        console.error("Error updating full customer:", error);

        if (error instanceof TRPCError) {
          throw error;
        }

        // Handle unique constraint violations
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          const target = error.meta?.target as string[] | undefined;
          if (target?.includes("code")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Kode customer sudah digunakan",
            });
          }
          if (target?.includes("npwpNumber")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Nomor NPWP sudah terdaftar",
            });
          }
          if (target?.includes("OnePrimaryAddressPerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Hanya boleh ada satu alamat utama per customer",
            });
          }
          if (target?.includes("OneAddressTypePerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Tipe alamat sudah ada untuk customer ini",
            });
          }
          if (target?.includes("OnePrimaryContactPerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Hanya boleh ada satu kontak utama per customer",
            });
          }
          if (target?.includes("OneContactTypePerCustomer")) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Tipe kontak sudah ada untuk customer ini",
            });
          }
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Gagal mengupdate customer",
        });
      }
    }),
});
