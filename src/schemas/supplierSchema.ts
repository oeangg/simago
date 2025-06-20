import { z } from "zod";
import {
  AddressType,
  ContactType,
  StatusActive,
  SupplierType,
} from "@prisma/client";

export const addressTypeSchema = z.nativeEnum(AddressType);
export const contactTypeSchema = z.nativeEnum(ContactType);
export const supplierTypeSchema = z.nativeEnum(SupplierType);
export const statusActiveSchema = z.nativeEnum(StatusActive);

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

// CREATE ADDRESS - Sesuaikan dengan model Prisma
export const inputSupplierAddressSchema = z
  .object({
    id: z.string().optional(),
    addressType: addressTypeSchema,
    addressLine1: z.string().min(1, "Alamat baris 1 tidak boleh kosong"),
    addressLine2: z.string().optional(),
    zipcode: z.string().optional(),
    isPrimaryAddress: z.boolean(),
    countryCode: z.string().min(1, "Kode negara tidak boleh kosong"), // Wajib sesuai model
    provinceCode: z.string().optional(),
    regencyCode: z.string().optional(),
    districtCode: z.string().optional(),
    supplierId: z.string().optional(),
  })
  .refine(
    (data) =>
      data.id ||
      data.isPrimaryAddress !== undefined ||
      data.addressType !== undefined,
    {
      message:
        "Setidaknya ID, isPrimaryAddress, atau addressType harus disediakan untuk mengidentifikasi alamat yang akan diperbarui.",
      path: ["id", "isPrimaryAddress", "addressType"],
    }
  );

export const inputSupplierContactSchema = z
  .object({
    id: z.string().optional(),
    contactType: contactTypeSchema,
    name: z.string().min(1, "Nama kontak tidak boleh kosong"),
    phoneNumber: z
      .string()
      .min(10, "Phonenumber harus terdiri minimal 10 karakter")
      .max(14, "Phonenumber harus terdiri maksimal 14 karakter")
      .regex(phoneRegex, "Invalid format phone!"),
    email: z.string().optional(),
    isPrimaryContact: z.boolean(),
    customerId: z.string().optional(),
  })
  .refine(
    (data) =>
      data.id ||
      data.isPrimaryContact !== undefined ||
      data.contactType !== undefined,
    {
      message:
        "Setidaknya ID, isPrimaryContact, atau contactType harus disediakan untuk mengidentifikasi kontak yang akan diperbarui.",
      path: ["id", "isPrimaryContact", "contactType"],
    }
  );

// Skema gabungan untuk CREATE Full Customer
export const supplierSchema = z.object({
  code: z.string().min(1, "Kode tidak boleh kosong"),
  name: z.string().min(1, "Nama tidak boleh kosong"),
  supplierType: supplierTypeSchema,
  statusActive: statusActiveSchema,
  activeDate: z.string().optional(),
  notes: z.string().optional(),
  npwpNumber: z.string().optional(),
  npwpName: z.string().optional(),
  npwpAddress: z.string().optional(),
  npwpDate: z.string().optional(),
  addresses: z
    .array(inputSupplierAddressSchema)
    .min(1, "Setidaknya satu alamat harus disediakan.")
    .refine((addresses) => {
      const primaryAddresses = addresses.filter((a) => a.isPrimaryAddress);
      // Jika ada primary address, hanya boleh satu
      if (primaryAddresses.length > 0) {
        return primaryAddresses.length === 1;
      }
      return true; // Jika tidak ada primary address, OK
    }, "Hanya satu alamat yang boleh dijadikan alamat utama.")
    .refine(
      (addresses) =>
        new Set(addresses.map((a) => a.addressType)).size === addresses.length,
      "Jenis alamat harus unik."
    )
    .optional(),
  contacts: z
    .array(inputSupplierContactSchema)
    .min(1, "Setidaknya satu kontak harus disediakan.")
    .refine((contacts) => {
      const primaryContacts = contacts.filter((c) => c.isPrimaryContact);
      // Jika ada primary contact, hanya boleh satu
      if (primaryContacts.length > 0) {
        return primaryContacts.length === 1;
      }
      return true; // Jika tidak ada primary contact, OK
    }, "Hanya satu kontak yang boleh dijadikan kontak utama.")
    .refine(
      (contacts) =>
        new Set(contacts.map((c) => c.contactType)).size === contacts.length,
      "Jenis kontak harus unik."
    )
    .optional(),
});

export type SupplierTypeSchema = z.infer<typeof supplierSchema>;
export const supplierUpdateSchema = supplierSchema.extend({
  id: z.string(),
});

export type SupplierUpdateTypeSchema = z.infer<typeof supplierUpdateSchema>;
export type InputSupplierAddressTypeSchema = z.infer<
  typeof inputSupplierAddressSchema
>;
export type InputSupplierContactTypeSchema = z.infer<
  typeof inputSupplierContactSchema
>;
