import { Gender } from "@prisma/client";
import { z } from "zod";

const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/
);

export const driverSchema = z.object({
  code: z
    .string()
    .min(1, "Kode Driver tidak boleh kosong")
    .max(10, "Kode Maksimal 10 karakter")
    .regex(
      /^[A-Z0-9-]+$/,
      "Kode vendor hanya boleh huruf kapital, angka, dan strip"
    ),
  name: z.string().min(1, "Nama tidak boleh kosong!"),
  gender: z.nativeEnum(Gender),
  addressLine1: z.string().min(1, "address line1 tidak boleh kosong!"),
  addressLine2: z.string().optional(),
  city: z.string().min(1, "city tidak boleh kosong!!"),
  phoneNumber: z
    .string()
    .min(10, "Phonenumber harus terdiri minimal 10 karakter")
    .max(14, "Phonenumber harus terdiri maksimal 14 karakter")
    .regex(phoneRegex, "Invalid format phone!"),
  statusActive: z.boolean(),
  activeDate: z.string().min(1, "ActiveDate tidak boleh kosong!"),
});

export type DriverTypeSchema = z.infer<typeof driverSchema>;

export const driverUpdateSchema = driverSchema.extend({
  id: z.string(),
});

export type DriverUpdateTypeSchema = z.infer<typeof driverUpdateSchema>;
