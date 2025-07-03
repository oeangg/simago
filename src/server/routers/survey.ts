import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import {
  SurveyCreateInputSchema,
  SurveyDeleteOutputSchema,
  SurveyDeleteSchema,
  SurveyGetByIdSchema,
  SurveyStatsOutputSchema,
  SurveyStatusHistoryListOutputSchema,
  SurveyStatusUpdateInputSchema,
  SurveyUpdateInputSchema,
} from "@/schemas/surveySchema";
import { generateSurveyCode } from "@/tools/generateCodeSurvey";
import { Prisma } from "@prisma/client";

export const surveyRouter = router({
  // Get all surveys with pagination
  getAllSurvey: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        search: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(["ONPROGRESS", "APPROVED", "REJECT"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, search, startDate, endDate, status } = input;
      const skip = (page - 1) * limit;

      // Build where conditions
      const whereConditions: Prisma.SurveyWhereInput = {};

      // Search conditions
      if (search) {
        whereConditions.OR = [
          {
            surveyNo: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            origin: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            destination: {
              contains: search,
              mode: "insensitive",
            },
          },
          {
            customers: {
              name: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        ];
      }

      // Date range filter
      if (startDate || endDate) {
        whereConditions.createdAt = {};
        if (startDate) {
          whereConditions.createdAt.gte = startDate;
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          whereConditions.createdAt.lte = endOfDay;
        }
      }

      // Status filter
      if (status) {
        whereConditions.statusSurvey = status;
      }

      const [surveys, total] = await Promise.all([
        ctx.db.survey.findMany({
          where: whereConditions,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            customers: true,
            surveyItems: true,
            statusHistories: {
              orderBy: { changedAt: "desc" },
              take: 1, // Get latest status history
            },
          },
        }),
        ctx.db.survey.count({ where: whereConditions }),
      ]);

      return {
        surveys,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get survey by ID
  getSurveyById: protectedProcedure
    .input(SurveyGetByIdSchema)
    .query(async ({ ctx, input }) => {
      const survey = await ctx.db.survey.findUnique({
        where: { id: input.id },
        include: {
          customers: {
            include: {
              addresses: {
                where: { isPrimaryAddress: true },
              },
              contacts: {
                where: { isPrimaryContact: true },
              },
            },
          },
          surveyItems: true,
          statusHistories: {
            orderBy: { changedAt: "desc" },
          },
        },
      });

      if (!survey) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Survey not found",
        });
      }

      return survey;
    }),

  // Create new survey
  createSurvey: protectedProcedure
    .input(SurveyCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db.$transaction(
          async (tx) => {
            // Verify customer exists
            const customer = await tx.customer.findUnique({
              where: { id: input.customerId },
            });

            if (!customer) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Customer not found",
              });
            }

            // Generate survey number
            const surveyNo = await generateSurveyCode({
              db: ctx.db,
              shipmentType: input.shipmentType,
              shipmentDetail: input.shipmentDetail,
            });

            // Create survey
            const survey = await tx.survey.create({
              data: {
                surveyNo,
                surveyDate: input.surveyDate,
                workDate: input.workDate,
                customerId: input.customerId,
                origin: input.origin,
                destination: input.destination,
                cargoType: input.cargoType,
                shipmentType: input.shipmentType,
                shipmentDetail: input.shipmentDetail,
                statusSurvey: "ONPROGRESS", // Default status
              },
            });

            // Create initial status history
            await tx.surveyStatusHistory.create({
              data: {
                surveyId: survey.id,
                status: "ONPROGRESS",
                changedBy: ctx.session!.userId, // Assuming user ID from session
                remarks: "Survey created",
              },
            });

            // Create survey items
            await tx.surveyItem.createMany({
              data: input.surveyItems.map((item) => ({
                ...item,
                surveyId: survey.id,
              })),
            });

            return survey;
          },
          {
            timeout: 20000,
          }
        );

        // Return the created survey with relations
        const createdSurvey = await ctx.db.survey.findUnique({
          where: { id: result.id },
          include: {
            customers: true,
            surveyItems: true,
            statusHistories: true,
          },
        });

        if (!createdSurvey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve created survey",
          });
        }

        return createdSurvey;
      } catch (error) {
        console.error("Error creating survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create survey",
        });
      }
    }),

  // Update existing survey
  updateSurvey: protectedProcedure
    .input(SurveyUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if survey exists
        const existingSurvey = await ctx.db.survey.findUnique({
          where: { id: input.id },
        });

        if (!existingSurvey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Survey not found",
          });
        }

        // Verify customer exists
        const customer = await ctx.db.customer.findUnique({
          where: { id: input.customerId },
        });

        if (!customer) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found",
          });
        }

        const result = await ctx.db.$transaction(
          async (tx) => {
            // Update survey
            const survey = await tx.survey.update({
              where: { id: input.id },
              data: {
                surveyDate: input.surveyDate,
                workDate: input.workDate,
                customerId: input.customerId,
                origin: input.origin,
                destination: input.destination,
                cargoType: input.cargoType,
                shipmentType: input.shipmentType,
                shipmentDetail: input.shipmentDetail,
              },
            });

            // Delete existing survey items
            await tx.surveyItem.deleteMany({
              where: { surveyId: input.id },
            });

            // Create new survey items
            await tx.surveyItem.createMany({
              data: input.surveyItems.map((item) => ({
                ...item,
                surveyId: survey.id,
              })),
            });

            return survey;
          },
          {
            timeout: 20000,
          }
        );

        // Return the updated survey with relations
        const updatedSurvey = await ctx.db.survey.findUnique({
          where: { id: result.id },
          include: {
            customers: true,
            surveyItems: true,
            statusHistories: true,
          },
        });

        return updatedSurvey;
      } catch (error) {
        console.error("Error updating survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update survey",
        });
      }
    }),

  // Update survey status
  updateStatusSurvey: protectedProcedure
    .input(SurveyStatusUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if survey exists
        const existingSurvey = await ctx.db.survey.findUnique({
          where: { id: input.id },
        });

        if (!existingSurvey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Survey not found",
          });
        }

        const result = await ctx.db.$transaction(
          async (tx) => {
            // Update survey status
            const survey = await tx.survey.update({
              where: { id: input.id },
              data: {
                statusSurvey: input.status,
              },
            });

            // Create status history record
            await tx.surveyStatusHistory.create({
              data: {
                surveyId: input.id,
                status: input.status,
                changedBy: ctx.session!.userId,
                remarks: input.remarks ?? null,
              },
            });

            return survey;
          },
          {
            timeout: 20000,
          }
        );

        // Return the updated survey with relations
        const updatedSurvey = await ctx.db.survey.findUnique({
          where: { id: result.id },
          include: {
            customers: true,
            surveyItems: true,
            statusHistories: {
              orderBy: { changedAt: "desc" },
            },
          },
        });

        if (!updatedSurvey) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to retrieve updated survey",
          });
        }

        return updatedSurvey;
      } catch (error) {
        console.error("Error updating survey status:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update survey status",
        });
      }
    }),

  // Get survey status history
  getStatusSurveyHistory: protectedProcedure
    .input(SurveyGetByIdSchema)
    .output(SurveyStatusHistoryListOutputSchema)
    .query(async ({ ctx, input }) => {
      const statusHistory = await ctx.db.surveyStatusHistory.findMany({
        where: { surveyId: input.id },
        orderBy: { changedAt: "desc" },
      });

      return statusHistory;
    }), // server/api/routers/survey.ts
  // Delete survey
  deleteSurvey: protectedProcedure
    .input(SurveyDeleteSchema)
    .output(SurveyDeleteOutputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if survey exists
        const existingSurvey = await ctx.db.survey.findUnique({
          where: { id: input.id },
        });

        if (!existingSurvey) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Survey not found",
          });
        }

        // Delete survey (cascade will handle survey items)
        await ctx.db.survey.delete({
          where: { id: input.id },
        });

        return { success: true, message: "Survey deleted successfully" };
      } catch (error) {
        console.error("Error deleting survey:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete survey",
        });
      }
    }),

  // Get survey statistics
  getStatsSurvey: protectedProcedure
    .output(SurveyStatsOutputSchema)
    .query(async ({ ctx }) => {
      const [
        totalSurveys,
        todaySurveys,
        thisMonthSurveys,
        onProgressSurveys,
        approvedSurveys,
        rejectedSurveys,
      ] = await Promise.all([
        ctx.db.survey.count(),
        ctx.db.survey.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        ctx.db.survey.count({
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        ctx.db.survey.count({
          where: { statusSurvey: "ONPROGRESS" },
        }),
        ctx.db.survey.count({
          where: { statusSurvey: "APPROVED" },
        }),
        ctx.db.survey.count({
          where: { statusSurvey: "REJECT" },
        }),
      ]);

      return {
        totalSurveys,
        todaySurveys,
        thisMonthSurveys,
        statusBreakdown: {
          onProgress: onProgressSurveys,
          approved: approvedSurveys,
          rejected: rejectedSurveys,
        },
      };
    }),

  // Get active customers for dropdown
  getActiveCustomers: protectedProcedure.query(async ({ ctx }) => {
    const customers = await ctx.db.customer.findMany({
      where: { statusActive: "ACTIVE" },
      select: {
        id: true,
        code: true,
        name: true,
        contacts: {
          where: {
            isPrimaryContact: true,
          },
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return customers;
  }),
});
