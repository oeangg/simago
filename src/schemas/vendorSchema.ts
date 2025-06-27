import {
  AddressType,
  BankingBank,
  ContactType,
  StatusActive,
  VendorType,
} from "@prisma/client";
import { z } from "zod";

export const addressTypeSchema = z.nativeEnum(AddressType);
export const contactTypeSchema = z.nativeEnum(ContactType);
export const statusActiveSchema = z.nativeEnum(StatusActive);
export const bankingBankSchema = z.nativeEnum(BankingBank);
export const vendorTypeSchema = z.nativeEnum(VendorType);

// Regex patterns
const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

const bankAccountRegex = new RegExp(/^\d{10,16}$/);

// ADDRESS SCHEMA
export const inputVendorAddressSchema = z
  .object({
    id: z.string().optional(),
    addressType: addressTypeSchema,
    addressLine1: z.string().min(1, "Alamat baris 1 tidak boleh kosong"),
    addressLine2: z.string().optional(),
    zipcode: z.string().optional(),
    isPrimaryAddress: z.boolean(),
    countryCode: z
      .string()
      .length(2, "Kode negara harus 2 karakter (ISO 3166-1 alpha-2)"),
    provinceCode: z.string().optional(),
    regencyCode: z.string().optional(),
    districtCode: z.string().optional(),
    vendorId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Untuk update, minimal harus ada identifier
      if (!data.id && data.vendorId) {
        return data.addressType !== undefined;
      }
      return true;
    },
    {
      message: "Untuk update, ID atau addressType harus disediakan",
      path: ["id"],
    }
  );

// CONTACT SCHEMA
export const inputVendorContactSchema = z
  .object({
    id: z.string().optional(),
    contactType: contactTypeSchema,
    name: z.string().min(1, "Nama kontak tidak boleh kosong"),
    faxNumber: z.string().optional(),
    phoneNumber: z
      .string()
      .min(10, "Nomor telepon minimal 10 karakter")
      .max(14, "Nomor telepon maksimal 14 karakter")
      .regex(phoneRegex, "Format nomor telepon tidak valid"),
    email: z.string().optional(),
    isPrimaryContact: z.boolean(),
    vendorId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Untuk update, minimal harus ada identifier
      if (!data.id && data.vendorId) {
        return data.contactType !== undefined;
      }
      return true;
    },
    {
      message: "Untuk update, ID atau contactType harus disediakan",
      path: ["id"],
    }
  );

// BANKING SCHEMA
export const inputVendorBankingSchema = z
  .object({
    id: z.string().optional(),
    bankingNumber: z
      .string()
      .regex(bankAccountRegex, "Nomor rekening harus 10-16 digit"),
    bankingName: z.string().min(1, "Nama pemilik rekening tidak boleh kosong"),
    bankingBank: bankingBankSchema,
    bankingBranch: z.string().min(1, "Cabang bank tidak boleh kosong"),
    isPrimaryBankingNumber: z.boolean(),
    vendorId: z.string().optional(),
  })
  .refine(
    (data) => {
      // Validasi nama pemilik rekening sesuai dengan nama vendor atau NPWP
      return data.bankingName.length > 0;
    },
    {
      message:
        "Nama pemilik rekening harus sesuai dengan nama vendor atau NPWP",
      path: ["bankingName"],
    }
  );

// Base vendor schema without refinements
export const vendorSchema = z.object({
  // Basic Information
  code: z
    .string()
    .min(1, "Kode vendor tidak boleh kosong")
    .max(10, "Kode Maksimal 10 karakter")
    .regex(
      /^[A-Z0-9-]+$/,
      "Kode vendor hanya boleh huruf kapital, angka, dan strip"
    ),

  name: z.string().min(1, "Nama vendor tidak boleh kosong"),
  vendorType: vendorTypeSchema,
  statusActive: statusActiveSchema,
  activeDate: z.string().min(1, "Tanggal aktif harus diisi"),
  paymentTerms: z
    .number()
    .min(0, "Terms pembayaran minimal 0 hari")
    .max(365, "Terms pembayaran maksimal 365 hari"),
  // Additional Info
  notes: z.string().max(500, "Catatan maksimal 500 karakter").optional(),

  // Tax Information (NPWP)
  npwpNumber: z.string().optional(),
  npwpName: z.string().optional(),
  npwpAddress: z.string().optional(),
  npwpDate: z.string().optional(),

  picName: z.string().optional(),
  picPosition: z.string().optional(),

  vendorAddresses: z
    .array(inputVendorAddressSchema)
    .min(1, "Minimal harus ada satu alamat")
    .refine((addresses) => {
      const primaryCount = addresses.filter((a) => a.isPrimaryAddress).length;
      return primaryCount === 1;
    }, "Harus ada tepat satu alamat utama")
    .refine((addresses) => {
      const types = addresses.map((a) => a.addressType);
      return new Set(types).size === types.length;
    }, "Tidak boleh ada duplikasi jenis alamat")
    .optional(),

  vendorContacts: z
    .array(inputVendorContactSchema)
    .min(1, "Minimal harus ada satu kontak")
    .refine((contacts) => {
      const primaryCount = contacts.filter((c) => c.isPrimaryContact).length;
      return primaryCount === 1;
    }, "Harus ada tepat satu kontak utama")
    .refine((contacts) => {
      const types = contacts.map((c) => c.contactType);
      return new Set(types).size === types.length;
    }, "Tidak boleh ada duplikasi jenis kontak")
    .optional(),

  vendorBankings: z
    .array(inputVendorBankingSchema)
    .min(1, "Minimal harus ada satu data banking")
    .refine((bankings) => {
      const primaryCount = bankings.filter(
        (b) => b.isPrimaryBankingNumber
      ).length;
      return primaryCount === 1;
    }, "Harus ada tepat satu rekening utama")
    .refine((bankings) => {
      const numbers = bankings.map((b) => b.bankingNumber);
      return new Set(numbers).size === numbers.length;
    }, "Tidak boleh ada duplikasi nomor rekening")
    .optional(),
});

export const vendorUpdateSchema = vendorSchema.extend({
  id: z.string(),
});

export type VendorTypeSchema = z.infer<typeof vendorSchema>;
export type VendorUpdateTypeSchema = z.infer<typeof vendorUpdateSchema>;
export type InputVendorAddressTypeSchema = z.infer<
  typeof inputVendorAddressSchema
>;
export type InputVendorContactTypeSchema = z.infer<
  typeof inputVendorContactSchema
>;
export type InputVendorBankingTypeSchema = z.infer<
  typeof inputVendorBankingSchema
>;
