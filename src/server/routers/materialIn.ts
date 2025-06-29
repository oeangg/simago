import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  createMaterialInInput,
  deleteMaterialInInput,
  getMaterialInByIdInput,
  getMaterialInsInput,
  materialInItemSchema,
  materialInSchema,
  updateMaterialInInput,
} from "@/schemas/materialInSchema";
import { TRPCError } from "@trpc/server";

export const materialInRouter = router({
  // Create Material In with Transaction
  createMaterialIn: protectedProcedure
    .input(createMaterialInInput)
    .output(materialInSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session?.userId;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not authenticated",
        });
      }

      // Generate transaction number
      const today = new Date();
      const prefix = `MI-${today.getFullYear()}${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;

      // Get last transaction number for today
      const lastTransaction = await ctx.db.materialIn.findFirst({
        where: {
          transactionNo: {
            startsWith: prefix,
          },
        },
        orderBy: {
          transactionNo: "desc",
        },
      });

      let sequence = 1;
      if (lastTransaction) {
        const lastSequence = parseInt(
          lastTransaction.transactionNo.split("-").pop() || "0"
        );
        sequence = lastSequence + 1;
      }

      const transactionNo = `${prefix}-${String(sequence).padStart(4, "0")}`;

      // Use transaction to ensure data consistency
      const result = await ctx.db.$transaction(async (prisma) => {
        // Create Material In
        const materialIn = await prisma.materialIn.create({
          data: {
            transactionNo,
            supplierId: input.supplierId,
            supplierName: input.supplierName,
            transactionDate: input.transactionDate || new Date(),
            invoiceNo: input.invoiceNo || null,
            totalAmountBeforeTax: input.totalAmountBeforeTax,
            totalTax: input.totalTax || null,
            otherCosts: input.otherCosts || null,
            totalAmount: input.totalAmount,
            notes: input.notes || null,
            createdBy: userId,
            items: {
              create: await Promise.all(
                input.items.map(async (item) => {
                  // Get current stock
                  const material = await prisma.material.findUnique({
                    where: { id: item.materialId },
                  });

                  if (!material) {
                    throw new TRPCError({
                      code: "NOT_FOUND",
                      message: `Material with id ${item.materialId} not found`,
                    });
                  }

                  const stockField =
                    item.stockType === "BAD" ? "badStock" : "goodStock";
                  const currentStock = material[stockField];

                  console.log(`CURENT STOCK : ${currentStock}`);

                  // Update material stock
                  await prisma.material.update({
                    where: { id: item.materialId },
                    data: { [stockField]: currentStock + item.quantity },
                  });

                  return {
                    materialId: item.materialId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalPrice: item.quantity * item.unitPrice,
                    stockType: item.stockType || "GOOD",
                    notes: item.notes || null,
                    stockBefore: currentStock,
                    stockAfter: currentStock + item.quantity,
                  };
                })
              ),
            },
          },
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        });

        return materialIn;
      });

      return result;
    }),

  // Update Material In
  updateMaterialIn: protectedProcedure
    .input(updateMaterialInInput)
    .output(materialInSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if material in exists
      const existing = await ctx.db.materialIn.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Material In not found",
        });
      }

      // Update only main data (not items in this example)
      const updated = await ctx.db.materialIn.update({
        where: { id },
        data: {
          ...updateData,
          invoiceNo:
            updateData.invoiceNo !== undefined
              ? updateData.invoiceNo || null
              : undefined,
          totalTax:
            updateData.totalTax !== undefined
              ? updateData.totalTax || null
              : undefined,
          otherCosts:
            updateData.otherCosts !== undefined
              ? updateData.otherCosts || null
              : undefined,
          notes:
            updateData.notes !== undefined
              ? updateData.notes || null
              : undefined,
        },
        include: {
          items: {
            include: {
              material: true,
            },
          },
        },
      });

      return updated;
    }),

  // Get Material In by ID
  getMaterialById: protectedProcedure
    .input(getMaterialInByIdInput)
    .output(
      materialInSchema.extend({
        items: z.array(
          materialInItemSchema.extend({
            material: z.object({
              id: z.string(),
              code: z.string(),
              name: z.string(),
              unit: z.string(),
            }),
          })
        ),
      })
    )
    .query(async ({ ctx, input }) => {
      const materialIn = await ctx.db.materialIn.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: {
              material: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  unit: true,
                },
              },
            },
          },
        },
      });

      if (!materialIn) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Material In not found",
        });
      }

      return materialIn;
    }),

  // Get All Material Ins with Pagination
  getMaterialAll: protectedProcedure
    .input(getMaterialInsInput)
    .output(
      z.object({
        data: z.array(materialInSchema),
        total: z.number(),
        page: z.number(),
        limit: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const {
        page,
        limit,
        search,
        supplierId,
        startDate,
        endDate,
        sortBy,
        sortOrder,
      } = input;

      const where = {
        ...(search && {
          OR: [
            {
              transactionNo: { contains: search, mode: "insensitive" as const },
            },
            {
              supplierName: { contains: search, mode: "insensitive" as const },
            },
            { invoiceNo: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(supplierId && { supplierId }),
        ...(startDate &&
          endDate && {
            transactionDate: {
              gte: startDate,
              lte: endDate,
            },
          }),
      };

      const [data, total] = await ctx.db.$transaction([
        ctx.db.materialIn.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            items: true,
          },
        }),
        ctx.db.materialIn.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  // Di material-in router
  getLastTransactionNumber: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    const prefix = `MI-${today.getFullYear()}${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    const lastTransaction = await ctx.db.materialIn.findFirst({
      where: {
        transactionNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        transactionNo: "desc",
      },
      select: {
        transactionNo: true,
      },
    });

    return lastTransaction?.transactionNo || null;
  }),

  // Delete Material In
  deleteMaterialIn: protectedProcedure
    .input(deleteMaterialInInput)
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Check if exists
      const existing = await ctx.db.materialIn.findUnique({
        where: { id: input.id },
        include: { items: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Material In not found",
        });
      }

      // Use transaction to revert stock and delete
      await ctx.db.$transaction(async (prisma) => {
        // Revert stock for each item
        for (const item of existing.items) {
          // Determine which stock field to decrement based on stockType
          const stockField =
            item.stockType === "BAD" ? "badStock" : "goodStock";

          await prisma.material.update({
            where: { id: item.materialId },
            data: {
              [stockField]: {
                decrement: item.quantity,
              },
            },
          });
        }

        // Delete material in (items will cascade delete)
        await prisma.materialIn.delete({
          where: { id: input.id },
        });
      });

      return { success: true };
    }),
});
