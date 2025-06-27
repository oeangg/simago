"use client";

import { useEffect, useCallback } from "react";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { trpc } from "@/app/_trpcClient/client";

import { Brand, MaterialCategory, Prisma, Unit } from "@prisma/client";
import {
  createMaterialSchema,
  CreateMaterialTypeSchema,
  updateMaterialSchema,
  UpdateMaterialTypeSchema,
} from "@/schemas/materialSchema";

interface MaterialFormProps {
  material?: {
    id: string;
    code: string;
    name: string;
    description?: string | null;
    category: MaterialCategory;
    unit: Unit;
    brand: Brand;
    currentStock: number;
    minimumStock: number;
    maximumStock?: number | null;
    goodStock?: number | null;
    badStock?: number | null;
    lastPurchasePrice?: number | null;
  };
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

type MaterialFormData = CreateMaterialTypeSchema | UpdateMaterialTypeSchema;

// Type guard untuk check apakah data memiliki id (untuk update)
function isUpdateData(
  data: MaterialFormData
): data is UpdateMaterialTypeSchema {
  return "id" in data;
}

export function MaterialForm({
  material,
  mode,
  onSuccess,
  onCancel,
}: MaterialFormProps) {
  const {
    data: materialData,
    isLoading: isLoadingMaterial,
    isPending: isPendingMaterial,
  } = trpc.Material.getMaterialById.useQuery(
    { id: material?.id || "" },
    { enabled: mode === "edit" && !!material?.id }
  );

  // Initialize form default values
  const getDefaultValues = useCallback((): MaterialFormData => {
    if (mode === "edit" && materialData) {
      return {
        id: materialData.id,
        code: materialData.code,
        name: materialData.name,
        description: materialData.description || "",
        category: materialData.category,
        unit: materialData.unit,
        brand: materialData.brand,
        currentStock: materialData.currentStock,
        minimumStock: materialData.minimumStock,
        maximumStock: materialData.maximumStock ?? undefined,
        goodStock: materialData.goodStock ?? undefined,
        badStock: materialData.badStock ?? undefined,
        lastPurchasePrice: materialData.lastPurchasePrice
          ? parseFloat(materialData.lastPurchasePrice.toString())
          : undefined,
      };
    }

    // Default values untuk create mode
    return {
      code: "",
      name: "",
      description: "",
      category: "RAW_MATERIAL" as MaterialCategory,
      unit: "BOX" as Unit,
      brand: "SCHNEIDER" as Brand,
      currentStock: 0,
      minimumStock: 0,
      maximumStock: undefined,
      goodStock: undefined,
      badStock: undefined,
      lastPurchasePrice: undefined,
    };
  }, [materialData, mode]);

  const resolver =
    mode === "create"
      ? (zodResolver(
          createMaterialSchema
        ) as Resolver<CreateMaterialTypeSchema>)
      : (zodResolver(
          updateMaterialSchema
        ) as Resolver<UpdateMaterialTypeSchema>);

  const form = useForm<MaterialFormData>({
    resolver: resolver as Resolver<MaterialFormData>,
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });
  // Re-initialize form (edit mode)
  useEffect(() => {
    if (mode === "edit" && materialData && !isPendingMaterial) {
      const defaultValues = getDefaultValues();
      form.reset(defaultValues);
    }
  }, [materialData, mode, isPendingMaterial, form, getDefaultValues]);
  // Mutations
  const createMaterial = trpc.Material.createMaterial.useMutation({
    onSuccess: () => {
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error creating material:", error);
    },
  });

  const updateMaterial = trpc.Material.updateMaterial.useMutation({
    onSuccess: () => {
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("Error updating material:", error);
    },
  });

  // Submit handler dengan type checking
  const onSubmit = async (data: MaterialFormData) => {
    try {
      // Convert number back to Decimal for Prisma
      const submitData = {
        ...data,
        lastPurchasePrice: data.lastPurchasePrice
          ? new Prisma.Decimal(data.lastPurchasePrice)
          : null,
      };

      if (mode === "create" && !isUpdateData(data)) {
        await createMaterial.mutateAsync(
          submitData as CreateMaterialTypeSchema
        );
      } else if (mode === "edit" && isUpdateData(data)) {
        await updateMaterial.mutateAsync(
          submitData as UpdateMaterialTypeSchema
        );
      }
    } catch (error) {
      // Error sudah di-handle di onError
    }
  };

  return <></>;
}
