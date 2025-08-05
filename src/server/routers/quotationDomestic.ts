import {
  createQuotationDomesticSchema,
  updateQuotationDomesticSchema,
} from "@/schemas/quotationDomesticSchema";
import { protectedProcedure, router } from "../trpc";
import { generateQuotationDomNumber } from "@/tools/generateQuotationNumber";
import { TRPCError } from "@trpc/server";

export const quotationDomesticRouter = router({
  createQuotationDomestic: protectedProcedure
    .input(createQuotationDomesticSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { db, session } = ctx;

        //generate auto number
        const quotationNo = await generateQuotationDomNumber({
          db: db,
        });

        const pricingFields = [
          input.trucking,
          input.packing,
          input.handling,
          input.unloading,
          input.reposisi,
        ].filter(Boolean);

        const total =
          pricingFields.length > 0
            ? pricingFields.reduce(
                (sum: number, field) => sum + (field || 0),
                0
              )
            : 0;

        // Create quotation with status history
        const quotation = await db.quotationDomestic.create({
          // quotationDate tidak ada karena di prisma sudah default(now)
          data: {
            quotationNo,
            surveyId: input.surveyId,
            customerId: input.customerId,
            leadTime: input.leadTime,
            marketingName: input.marketingName,
            trucking: input.trucking || null,
            packing: input.packing || null,
            handling: input.handling || null,
            unloading: input.unloading || null,
            reposisi: input.reposisi || null,
            total,
            quotationStatusHistory: {
              create: {
                statusQuotation: "ONPROGRESS",
                changedBy: session!.userId,
                remarks: "Initial creation",
              },
            },
          },
          include: {
            customer: true,
            survey: true,
            quotationStatusHistory: {
              include: {
                user: true,
              },
              orderBy: {
                changedAt: "desc",
              },
            },
          },
        });

        return {
          success: true,
          data: quotation,
          message: "Berhasil membuat quotation!",
        };
      } catch (error) {
        console.error("Error creating quotation:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create quotation",
        });
      }
    }),

  updateQuotationDomestic: protectedProcedure
    .input(updateQuotationDomesticSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const { id, ...data } = input;

        // Check if quotation exists
        const existing = await ctx.db.quotationDomestic.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Quotation not found",
          });
        }

        let total: number | null = null;
        if (
          data.trucking !== undefined ||
          data.packing !== undefined ||
          data.handling !== undefined ||
          data.unloading !== undefined ||
          data.reposisi !== undefined
        ) {
          const trucking = data.trucking ?? existing.trucking?.toNumber() ?? 0;
          const packing = data.packing ?? existing.packing?.toNumber() ?? 0;
          const handling = data.handling ?? existing.handling?.toNumber() ?? 0;
          const unloading =
            data.unloading ?? existing.unloading?.toNumber() ?? 0;
          const reposisi = data.reposisi ?? existing.reposisi?.toNumber() ?? 0;

          total = trucking + packing + handling + unloading + reposisi;
        } else if (existing.total) {
          total = existing.total.toNumber();
        }

        // Update quotation
        const quotation = await ctx.db.quotationDomestic.update({
          where: { id },
          data: {
            ...data,
            total: total && total > 0 ? total : null,
          },
          include: {
            customer: true,
            survey: true,
            quotationStatusHistory: true,
          },
        });

        return {
          data: quotation,
          message: "Berhasil update quotation!",
        };
      } catch (error) {
        console.error("Error update quotation:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update quotation",
        });
      }
    }),
});
