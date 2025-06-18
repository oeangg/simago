import { Gender } from "@prisma/client";
import { z } from "zod";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

// Employment schema
export const employmentSchema = z.object({
  id: z.string().optional(),
  startDate: z.string().min(1, "Tanggal mulai harus diisi"),
  endDate: z.string().optional(),
  positionId: z.string().min(1, "Posisi harus dipilih"),
  employeeId: z.string().optional(),
});

export const employeeSchema = z.object({
  nik: z
    .string()
    .min(1, { message: "NIK tidak boleh kosong" })
    .max(12, { message: "NIK terlalu panjang" }),
  name: z.string().min(1, { message: "Nama tidak boleh kosong" }),
  isActive: z.boolean(),
  gender: z.nativeEnum(Gender),
  address: z.string().min(1, { message: "Alamat tidak boleh kosong" }),
  city: z.string().min(1, { message: "Kota tidak boleh kosong" }),
  zipcode: z
    .string()
    .min(1, { message: "Kode pos tidak boleh kosong" })
    .max(5, { message: "Kode pos max 5 karakter" }),
  photo: z.string().optional(),

  phoneNumber: z
    .string()
    .min(10, "Phonenumber harus terdiri minimal 10 karakter")
    .max(14, "Phonenumber harus terdiri maksimal 14 karakter")
    .regex(phoneRegex, "Invalid format phone!"),
  employments: z.array(employmentSchema).optional(),
});

export type employeeTypeSchema = z.infer<typeof employeeSchema>;
export type employmentTYpeSchema = z.infer<typeof employmentSchema>;

export const employeeSchemaUpdate = employeeSchema.extend({
  id: z.string(),
});

export const positionSchema = z.object({
  // id: z.string(),
  name: z.string().min(1, "Nama posisi harus diisi"),
});

export type positionTypeSchema = z.infer<typeof positionSchema>;
