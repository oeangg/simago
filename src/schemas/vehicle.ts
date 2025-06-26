import { VehicleType } from "@prisma/client";
import { z } from "zod";

export const vehicleSchema = z.object({
  vehicleNumber: z
    .string()
    .min(1, "Kode Driver tidak boleh kosong")
    .regex(
      /^[A-Z0-9\s]+$/,
      "Nomor kendaraan hanya boleh huruf kapital, angka, dan spasi"
    ),

  vehicleType: z.nativeEnum(VehicleType),
  vehicleMake: z.string().optional(),
  vehicleYear: z.string().optional(),
});

export type VehicleTypeSchema = z.infer<typeof vehicleSchema>;

export const vehicleUpdateSchema = vehicleSchema.extend({
  id: z.string(),
});

export type VehicleUpdateSchema = z.infer<typeof vehicleUpdateSchema>;
