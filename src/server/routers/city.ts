// Updated tRPC Router dengan field name yang baru
import {
  districtsCsvUploadSchema,
  getDistrictsInputSchema,
  getRegenciesInputSchema,
  provincesCsvUploadSchema,
  regenciesCsvUploadSchema,
} from "@/schemas/citySchema";
import { publicProcedure, router } from "../trpc";

export const cityRouter = router({
  createProvinces: publicProcedure
    .input(provincesCsvUploadSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // console.log("INPUT DARI FRONTEND:", input);
        // console.log("INPUT LENGTH:", input.length);

        if (!Array.isArray(input) || input.length === 0) {
          return {
            success: false,
            message: "Tidak ada data provinsi untuk diunggah.",
            count: 0,
          };
        }

        const provincePromises = input.map((p) => {
          // console.log("Processing province:", p);
          return ctx.db.province.upsert({
            where: { code: p.code },
            update: { name: p.name },
            create: { code: p.code, name: p.name },
          });
        });

        const results = await ctx.db.$transaction(provincePromises);
        console.log("Transaction results:", results);

        return {
          success: true,
          message: `${input.length} provinsi berhasil disimpan!`,
          count: input.length,
        };
      } catch (error) {
        console.error("Gagal menyimpan data provinsi:", error);
        throw new Error(
          "Gagal menyimpan data provinsi ke database: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    }),

  createRegencies: publicProcedure
    .input(regenciesCsvUploadSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // console.log("INPUT REGENCIES DARI FRONTEND:", input);
        // console.log("INPUT REGENCIES LENGTH:", input.length);

        if (!Array.isArray(input) || input.length === 0) {
          return {
            success: false,
            message: "Tidak ada data kabupaten untuk diunggah.",
            count: 0,
          };
        }

        const regencyPromises = input.map((r) => {
          // console.log("Processing regency:", r);
          return ctx.db.regency.upsert({
            where: { code: r.code },
            update: {
              name: r.name,
              provinceCode: r.provinceCode,
            },
            create: {
              code: r.code,
              name: r.name,
              provinceCode: r.provinceCode,
            },
          });
        });

        const results = await ctx.db.$transaction(regencyPromises);
        console.log("Regency transaction results:", results);

        return {
          success: true,
          message: `${input.length} kabupaten/kota berhasil disimpan!`,
          count: input.length,
        };
      } catch (error) {
        console.error("Gagal menyimpan data kabupaten/kota:", error);
        throw new Error(
          "Gagal menyimpan data kabupaten/kota ke database: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    }),

  createDistricts: publicProcedure
    .input(districtsCsvUploadSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // console.log("INPUT DISTRICTS DARI FRONTEND:", input);
        // console.log("INPUT DISTRICTS LENGTH:", input.length);

        if (!Array.isArray(input) || input.length === 0) {
          return {
            success: false,
            message: "Tidak ada data kecamatan untuk diunggah.",
            count: 0,
          };
        }

        const districtPromises = input.map((d) => {
          // console.log("Processing district:", d);
          return ctx.db.district.upsert({
            where: { code: d.code },
            update: {
              name: d.name,
              regencyCode: d.regencyCode,
            },
            create: {
              code: d.code,
              name: d.name,
              regencyCode: d.regencyCode,
            },
          });
        });

        const results = await ctx.db.$transaction(districtPromises);
        console.log("District transaction results:", results);

        return {
          success: true,
          message: `${input.length} kecamatan berhasil disimpan!`,
          count: input.length,
        };
      } catch (error) {
        console.error("Gagal menyimpan data kecamatan:", error);
        throw new Error(
          "Gagal menyimpan data kecamatan ke database: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
      }
    }),

  getProvinces: publicProcedure.query(async ({ ctx }) => {
    try {
      const provinces = await ctx.db.province.findMany({
        orderBy: { name: "asc" },
      });
      return provinces;
    } catch (error) {
      console.error("Gagal mengambil provinsi:", error);
      throw new Error("Gagal mengambil data provinsi.");
    }
  }),

  getRegenciesByProvinceCode: publicProcedure
    .input(getRegenciesInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        const regencies = await ctx.db.regency.findMany({
          where: { provinceCode: input.provinceCode },
        });
        return regencies;
      } catch (error) {
        console.error("Gagal mengambil kabupaten:", error);
        throw new Error("Gagal mengambil data kabupaten/kota.");
      }
    }),

  getDistrictsByRegencyCode: publicProcedure
    .input(getDistrictsInputSchema)
    .query(async ({ input, ctx }) => {
      try {
        const districts = await ctx.db.district.findMany({
          where: { regencyCode: input.regencyCode },
          orderBy: { name: "asc" },
        });
        return districts;
      } catch (error) {
        console.error("Gagal mengambil kecamatan:", error);
        throw new Error("Gagal mengambil data kecamatan.");
      }
    }),
});
