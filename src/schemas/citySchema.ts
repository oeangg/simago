import { z } from "zod";

export const provinceSchema = z.object({
  code: z.string().min(1, "Kode provinsi tidak boleh kosong"),
  name: z.string().min(1, "Nama provinsi tidak boleh kosong"),
});

export const regencySchema = z.object({
  provinceCode: z.string().min(1, "Kode provinsi tidak boleh kosong"),
  code: z.string().min(1, "Kode regency tidak boleh kosong"),
  name: z.string().min(1, "Nama regency tidak boleh kosong"),
});

export const districtSchema = z.object({
  regencyCode: z.string().min(1, "Kode regency tidak boleh kosong"),
  code: z.string().min(1, "Kode district tidak boleh kosong"),
  name: z.string().min(1, "Nama district tidak boleh kosong"),
});

//scehma input
export const provincesCsvUploadSchema = z.array(provinceSchema);
export const regenciesCsvUploadSchema = z.array(regencySchema);
export const districtsCsvUploadSchema = z.array(districtSchema);

export const getRegenciesInputSchema = z.object({
  provinceCode: z.string().min(1, "Kode provinci diperlukan"),
});

// Skema untuk input mendapatkan Districts
export const getDistrictsInputSchema = z.object({
  regencyCode: z.string().min(1, "Kode regency diperlukan"),
});
