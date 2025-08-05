// lib/validations/survey.ts
import {
  CargoType,
  ShipmentDetail,
  ShipmentType,
  SurveyStatus,
} from "@prisma/client";
import { z } from "zod";

// Enums
export const CargoTypeEnum = z.nativeEnum(CargoType);
export const ShipmentTypeEnum = z.nativeEnum(ShipmentType);
export const ShipmentDetailEnum = z.nativeEnum(ShipmentDetail);
export const SurveyStatusEnum = z.nativeEnum(SurveyStatus);

// Customer Schema - sesuai dengan existing database structure

// Survey Status History Schema
export const SurveyStatusHistorySchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  status: SurveyStatusEnum,
  changedBy: z.string(),
  changedAt: z.date(),
  remarks: z.string().nullable().optional(),
  createdAt: z.date(),
});

// Survey Item Schema
export const SurveyItemSchema = z.object({
  id: z.string(),
  surveyId: z.string(),
  name: z.string().min(1, "Item name is required"),
  width: z.number().positive("Width must be positive"),
  length: z.number().positive("Length must be positive"),
  height: z.number().positive("Height must be positive"),
  quantity: z.number().int().positive("Quantity must be positive integer"),
  cbm: z.number().positive("CBM must be positive"),
  note: z.string().nullable().optional(), // Changed from optional to nullable
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Survey Schema (Full)
export const SurveySchema = z.object({
  id: z.string(),
  surveyNo: z.string(),
  surveyDate: z.date(),
  workDate: z.date(),
  customerId: z.string(),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoType: CargoTypeEnum,
  shipmentType: ShipmentTypeEnum,
  shipmentDetail: ShipmentDetailEnum,
  statusSurvey: SurveyStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
  // surveyItems: z.array(SurveyItemSchema),
  // statusHistories: z.array(SurveyStatusHistorySchema).optional(),
});

// Input Schemas for Forms
export const SurveyItemInputSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  width: z.number().positive("Width must be positive"),
  length: z.number().positive("Length must be positive"),
  height: z.number().positive("Height must be positive"),
  quantity: z.number().int().positive("Quantity must be positive integer"),
  cbm: z.number().positive("CBM must be positive"),
  note: z.string().nullable().optional(),
});

// Simplified - hanya butuh customerId, bukan create customer baru
export const SurveyCreateInputSchema = z.object({
  surveyDate: z.date(),
  workDate: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoType: CargoTypeEnum,
  shipmentType: ShipmentTypeEnum,
  shipmentDetail: ShipmentDetailEnum,
  surveyItems: z
    .array(SurveyItemInputSchema)
    .min(1, "At least one item is required"),
});

export const SurveyUpdateInputSchema = z.object({
  id: z.string(),
  surveyDate: z.date(),
  workDate: z.date(),
  customerId: z.string().min(1, "Customer is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoType: CargoTypeEnum,
  shipmentType: ShipmentTypeEnum,
  shipmentDetail: ShipmentDetailEnum,
  surveyItems: z
    .array(SurveyItemInputSchema)
    .min(1, "At least one item is required"),
});

// Status Update Schema
export const SurveyStatusUpdateInputSchema = z.object({
  id: z.string(),
  status: SurveyStatusEnum,
  remarks: z.string().optional(),
});

export const SurveyGetByIdSchema = z.object({
  id: z.string(),
});

export const SurveyDeleteSchema = z.object({
  id: z.string(),
});

// Output Schemas for tRPC - Raw database structure
export const SurveyWithRelationsSchema = z.object({
  id: z.string(),
  surveyNo: z.string(),
  surveyDate: z.date(),
  workDate: z.date(),
  customerId: z.string(),
  origin: z.string(),
  destination: z.string(),
  cargoType: CargoTypeEnum,
  shipmentType: ShipmentTypeEnum,
  shipmentDetail: ShipmentDetailEnum,
  statusSurvey: SurveyStatusEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
  surveyItems: z.array(SurveyItemSchema),
  statusHistories: z.array(SurveyStatusHistorySchema),
});

export const SurveyStatusHistoryListOutputSchema = z.array(
  SurveyStatusHistorySchema
);

// Form Data Schema (for React Hook Form)
export const SurveyFormDataSchema = z.object({
  surveyDate: z.string().min(1, "Survey date is required"),
  workDate: z.string().min(1, "Work date is required"),
  customerId: z.string().min(1, "Customer is required"),
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  cargoType: CargoTypeEnum,
  shipmentType: ShipmentTypeEnum,
  shipmentDetail: ShipmentDetailEnum,
  surveyItems: z
    .array(
      z.object({
        name: z.string().min(1, "Item name is required"),
        width: z
          .string()
          .min(1, "Width is required")
          .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            "Width must be positive number"
          ),
        length: z
          .string()
          .min(1, "Length is required")
          .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            "Length must be positive number"
          ),
        height: z
          .string()
          .min(1, "Height is required")
          .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            "Height must be positive number"
          ),
        quantity: z
          .string()
          .min(1, "Quantity is required")
          .refine(
            (val) =>
              !isNaN(Number(val)) &&
              Number(val) > 0 &&
              Number.isInteger(Number(val)),
            "Quantity must be positive integer"
          ),
        cbm: z
          .string()
          .min(1, "CBM is required")
          .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            "CBM must be positive number"
          ),
        note: z.string().optional(),
      })
    )
    .min(1, "At least one item is required"),
});

// Type exports

export type SurveyItem = z.infer<typeof SurveyItemSchema>;
export type SurveyStatusHistory = z.infer<typeof SurveyStatusHistorySchema>;
export type Survey = z.infer<typeof SurveySchema>;
export type SurveyItemInput = z.infer<typeof SurveyItemInputSchema>;
export type SurveyCreateInput = z.infer<typeof SurveyCreateInputSchema>;
export type SurveyUpdateInput = z.infer<typeof SurveyUpdateInputSchema>;
export type SurveyStatusUpdateInput = z.infer<
  typeof SurveyStatusUpdateInputSchema
>;
export type SurveyFormData = z.infer<typeof SurveyFormDataSchema>;
