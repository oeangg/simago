import { z } from "zod";
import {
  AddressType,
  ContactType,
  CustomerType,
  StatusActive,
} from "@prisma/client";

const addressTypeSchema = z.nativeEnum(AddressType);
const contactTypeSchema = z.nativeEnum(ContactType);
const customerTypeSchema = z.nativeEnum(CustomerType);
const statusActiveSchema = z.nativeEnum(StatusActive);

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

//create
export const createCustomerSchema = z.object({
  code: z.string().min(1, "Kode tidak boleh kosong"),
  name: z.string().min(1, "Nama tidak boleh kosong"),
  customerType: customerTypeSchema,
  notes: z.string().optional(),
});

//update
export const updateCustomerSchema = z.object({
  id: z.string().cuid("Customer ID tidak valid"),
  code: z.string().min(1, "Kode tidak boleh kosong").optional(),
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  customerType: customerTypeSchema.optional(),
  statusActive: statusActiveSchema.optional(),
  notes: z.string().optional(),
});

export const deleteCustomerSchema = z.object({
  id: z.string().cuid("ID Customer tidak valid"),
});

export const getCustomerByIdSchema = z.object({
  id: z.string().cuid("ID Customer tidak valid"),
});

export const createAddressInputSchema = z.object({
  addressType: addressTypeSchema,
  addressLine1: z.string().min(1, "Alamat baris 1 tidak boleh kosong"),
  addressLine2: z.string().optional(),
  zipcode: z.string().optional(),
  isPrimaryAddress: z.boolean(),
  countryId: z.string().cuid("ID Negara tidak valid"),
  provinceCode: z.string().cuid("Provinsi tidak valid").optional(),
  regencyCode: z.string().cuid("Kota tidak valid").optional(),
  districtCode: z.string().cuid("Kota tidak valid").optional(),
});

export const updateAddressInputSchema = z
  .object({
    id: z.string().cuid("ID Alamat Customer tidak valid").optional(),
    addressType: addressTypeSchema.optional(),
    addressLine1: z
      .string()
      .min(1, "Alamat baris 1 tidak boleh kosong")
      .optional(),
    addressLine2: z.string().optional(),
    zipcode: z.string().optional(),
    isPrimaryAddress: z.boolean().optional(),
    countryId: z.string().cuid("ID Negara tidak valid").optional(),
    provinceCode: z.string().cuid("Provinsi tidak valid").optional(),
    regencyCode: z.string().cuid("Kota tidak valid").optional(),
    districtCode: z.string().cuid("Kota tidak valid").optional(),
  })
  .refine(
    (data) =>
      data.id ||
      data.isPrimaryAddress !== undefined ||
      data.addressType !== undefined,
    {
      // Setidaknya harus ada ID atau kriteria identifikasi
      message:
        "Setidaknya ID, isPrimaryAddress, atau addressType harus disediakan untuk mengidentifikasi alamat yang akan diperbarui.",
      path: ["id", "isPrimaryAddress", "addressType"],
    }
  );

export const createContactInputSchema = z.object({
  contactType: contactTypeSchema,
  name: z.string().min(1, "Nama kontak tidak boleh kosong"),
  phoneNumber: z
    .string()
    .min(10, "Phonenumber harus terdiri minimal 10 karakter")
    .max(14, "Phonenumber harus terdiri maksimal 14 karakter")
    .regex(phoneRegex, "Invalid format phone!"),
  email: z.string().email("Email tidak valid").optional(),
  isPrimaryContact: z.boolean(),
});

export const updateContactInputSchema = z
  .object({
    id: z.string().cuid("ID Kontak Customer tidak valid").optional(), // ID opsional untuk update, bisa di-match dengan primary/type
    contactType: contactTypeSchema.optional(),
    name: z.string().min(1, "Nama kontak tidak boleh kosong").optional(),
    phoneNumber: z
      .string()
      .min(1, "Nomor telepon tidak boleh kosong")
      .optional(),
    email: z.string().email("Email tidak valid").optional(),
    isPrimaryContact: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.id ||
      data.isPrimaryContact !== undefined ||
      data.contactType !== undefined,
    {
      // Setidaknya harus ada ID atau kriteria identifikasi
      message:
        "Setidaknya ID, isPrimaryContact, atau contactType harus disediakan untuk mengidentifikasi kontak yang akan diperbarui.",
      path: ["id", "isPrimaryContact", "contactType"],
    }
  );

export const createNpwpInputSchema = z.object({
  npwpNumber: z.string().min(1, "Nomor NPWP tidak boleh kosong"),
  npwpName: z.string().min(1, "Nama NPWP tidak boleh kosong"),
  npwpAddress: z.string().min(1, "Alamat NPWP tidak boleh kosong"),
  npwpDate: z.preprocess((arg) => {
    if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
  }, z.date()),
});

export const updateNpwpInputSchema = z.object({
  id: z.string().cuid("ID NPWP Customer tidak valid").optional(), // ID opsional, karena relasi 1-to-1 dengan customer
  npwpNumber: z.string().min(1, "Nomor NPWP tidak boleh kosong").optional(),
  npwpName: z.string().min(1, "Nama NPWP tidak boleh kosong").optional(),
  npwpAddress: z.string().min(1, "Alamat NPWP tidak boleh kosong").optional(),
  npwpDate: z
    .preprocess((arg) => {
      if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date())
    .optional(),
});

// Skema gabungan untuk CREATE Full Customer
export const createFullCustomerSchema = z.object({
  customer: createCustomerSchema,
  addresses: z
    .array(createAddressInputSchema)
    .min(1, "Setidaknya satu alamat harus disediakan.")
    .refine(
      (addresses) => addresses.filter((a) => a.isPrimaryAddress).length <= 1,
      "Hanya satu alamat utama yang diizinkan."
    )
    .refine(
      (addresses) =>
        new Set(addresses.map((a) => a.addressType)).size === addresses.length,
      "Jenis alamat harus unik."
    ),
  contacts: z
    .array(createContactInputSchema)
    .min(1, "Setidaknya satu kontak harus disediakan.")
    .refine(
      (contacts) => contacts.filter((c) => c.isPrimaryContact).length <= 1,
      "Hanya satu kontak utama yang diizinkan."
    )
    .refine(
      (contacts) =>
        new Set(contacts.map((c) => c.contactType)).size === contacts.length,
      "Jenis kontak harus unik."
    ),
  npwpInfo: createNpwpInputSchema.optional(), // NPWP tetap opsional
});

// Skema gabungan untuk UPDATE Full Customer
export const updateFullCustomerSchema = z
  .object({
    id: z.string().cuid("ID Customer tidak valid"),
    customer: updateCustomerSchema.omit({ id: true }).optional(),
    addresses: z.array(updateAddressInputSchema).optional(),
    contacts: z.array(updateContactInputSchema).optional(),
    npwpInfo: updateNpwpInputSchema.optional(),
  })
  .refine(
    (data) => {
      return (
        data.customer !== undefined ||
        (data.addresses !== undefined && data.addresses.length > 0) ||
        (data.contacts !== undefined && data.contacts.length > 0) ||
        data.npwpInfo !== undefined
      );
    },
    {
      message:
        "Setidaknya satu bagian dari customer (customer, alamat, kontak, atau NPWP) harus disediakan untuk update.",
      path: ["customer", "addresses", "contacts", "npwpInfo"],
    }
  )
  .refine(
    (data) => {
      if (!data.addresses) return true;
      const primaryAddresses = data.addresses.filter(
        (a) => a.isPrimaryAddress === true
      );
      return primaryAddresses.length <= 1;
    },
    {
      message: "Hanya satu alamat utama yang diizinkan.",
      path: ["addresses"],
    }
  )
  .refine(
    (data) => {
      if (!data.addresses) return true;
      const addressTypes = data.addresses
        .map((a) => a.addressType)
        .filter(Boolean); // Filter undefined di sini
      return new Set(addressTypes).size === addressTypes.length;
    },
    {
      message: "Jenis alamat harus unik.",
      path: ["addresses"],
    }
  )
  .refine(
    (data) => {
      if (!data.contacts) return true;
      const primaryContacts = data.contacts.filter(
        (c) => c.isPrimaryContact === true
      );
      return primaryContacts.length <= 1;
    },
    {
      message: "Hanya satu kontak utama yang diizinkan.",
      path: ["contacts"],
    }
  )
  .refine(
    (data) => {
      if (!data.contacts) return true;
      const contactTypes = data.contacts
        .map((c) => c.contactType)
        .filter(Boolean); // Filter undefined di sini
      return new Set(contactTypes).size === contactTypes.length;
    },
    {
      message: "Jenis kontak harus unik.",
      path: ["contacts"],
    }
  );

export type createFullCustomerTypeSchema = z.infer<
  typeof createFullCustomerSchema
>;
export type updateFullCustomerTypeSchema = z.infer<
  typeof updateFullCustomerSchema
>;
