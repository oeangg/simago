import { Gender } from "@prisma/client";
import { z } from "zod";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

// Employment schema

const requiredDateSchema = z.string().transform((str) => new Date(str));
const optionalDateSchema = z
  .string()
  .nullable()
  .optional()
  .transform((val) => (val ? new Date(val) : null));

export const employmentSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().min(1, "Tanggal mulai harus diisi"),
  endDate: z.string().optional(),
  positionId: z.string().min(1, "Posisi harus dipilih"),
  divisionId: z.string().min(1, "Divisi harus dipilih"),
  employeeId: z.string().optional(),
});

export const employeeSchema = z.object({
  nik: z
    .string()
    .min(1, "NIK tidak boleh kosong")
    .max(12, "NIK Maksimal 12 karakter")
    .regex(/^[A-Z0-9-]+$/, "NIK hanya boleh huruf kapital, angka, dan strip"),
  name: z.string().min(1, { message: "Nama tidak boleh kosong" }),
  isActive: z.boolean(),
  activeDate: z.string().min(1, "Tanggal Aktif harus diisi"),
  resignDate: z.string().optional(),
  gender: z.nativeEnum(Gender),
  address: z.string().min(1, { message: "Alamat tidak boleh kosong" }),
  city: z.string().min(1, { message: "Kota tidak boleh kosong" }),
  zipcode: z.string().regex(/^\d{5}$/, "Kode pos harus 5 digit"),
  photo: z.string().optional(),
  ttdDigital: z.string().optional(),

  phoneNumber: z
    .string()
    .min(10, "Phonenumber harus terdiri minimal 10 karakter")
    .max(14, "Phonenumber harus terdiri maksimal 14 karakter")
    .regex(phoneRegex, "Invalid format phone!"),
  // Membuat employments wajib dan minimal 1 item
  employments: z
    .array(employmentSchema)
    .min(1, "Minimal harus ada 1 riwayat pekerjaan")
    .nonempty("Riwayat pekerjaan tidak boleh kosong"),
});

export type employeeTypeSchema = z.infer<typeof employeeSchema>;
export type employmentTYpeSchema = z.infer<typeof employmentSchema>;

export const employeeSchemaUpdate = employeeSchema.extend({
  id: z.string(),
});

export type employeeUpdateTypeSchema = z.infer<typeof employeeSchemaUpdate>;

export const positionSchema = z.object({
  // id: z.string(),
  name: z.string().min(1, "Nama posisi harus diisi"),
});

export const divisonSchema = z.object({
  // id: z.string(),
  name: z.string().min(1, "Nama division harus diisi").toUpperCase(),
});

export type positionTypeSchema = z.infer<typeof positionSchema>;
export type DivisionTypeSchema = z.infer<typeof divisonSchema>;

const employmentRouterSchema = z.object({
  id: z.string().optional(),
  startDate: requiredDateSchema,
  endDate: optionalDateSchema,
  positionId: z.string().min(1, "Posisi harus dipilih"),
  divisionId: z.string().min(1, "Divisi harus dipilih"),
  employeeId: z.string().optional(),
});

export const inputEmployeeRouterSchema = z.object({
  nik: z
    .string()
    .min(1, "NIK tidak boleh kosong")
    .max(12, "NIK Maksimal 12 karakter")
    .regex(/^[A-Z0-9-]+$/, "NIK hanya boleh huruf kapital, angka, dan strip"),
  name: z.string().min(1, { message: "Nama tidak boleh kosong" }),
  isActive: z.boolean(),
  activeDate: requiredDateSchema,
  resignDate: optionalDateSchema,
  gender: z.nativeEnum(Gender),
  address: z.string().min(1, { message: "Alamat tidak boleh kosong" }),
  city: z.string().min(1, { message: "Kota tidak boleh kosong" }),
  zipcode: z.string().regex(/^\d{5}$/, "Kode pos harus 5 digit"),
  photo: z.string().optional(),
  ttdDigital: z.string().optional(),

  phoneNumber: z
    .string()
    .min(10, "Phonenumber harus terdiri minimal 10 karakter")
    .max(14, "Phonenumber harus terdiri maksimal 14 karakter")
    .regex(phoneRegex, "Invalid format phone!"),
  // Membuat employments wajib dan minimal 1 item
  employments: z
    .array(employmentRouterSchema)
    .min(1, "Minimal harus ada 1 riwayat pekerjaan")
    .nonempty("Riwayat pekerjaan tidak boleh kosong"),
});

export const updateEmployeeRouterSchema = inputEmployeeRouterSchema.extend({
  id: z.string(),
});

export type InputEmployeeRouterTypeSchema = z.infer<
  typeof inputEmployeeRouterSchema
>;
export type UpdateEmployeeRouterTypeSchema = z.infer<
  typeof updateEmployeeRouterSchema
>;
