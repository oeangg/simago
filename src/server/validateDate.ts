import { TRPCError } from "@trpc/server";

// Atau buat 2 function terpisah untuk required dan optional dates
export const validateRequiredDate = (
  dateString?: string | null,
  fieldName: string = "Tanggal"
): Date => {
  if (!dateString || dateString === "") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${fieldName} wajib diisi`,
    });
  }

  const tempDate = new Date(dateString);
  if (!isNaN(tempDate.getTime())) {
    return tempDate;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Format ${fieldName} tidak valid: ${dateString}`,
  });
};

export const validateOptionalDate = (
  dateString?: string | null
): Date | null => {
  if (!dateString || dateString === "") {
    return null;
  }

  const tempDate = new Date(dateString);
  if (!isNaN(tempDate.getTime())) {
    return tempDate;
  }

  throw new TRPCError({
    code: "BAD_REQUEST",
    message: `Format tanggal tidak valid: ${dateString}`,
  });
};
