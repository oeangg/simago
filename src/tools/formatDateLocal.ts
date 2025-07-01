import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export const formatDate = (date: string | Date | undefined | null) => {
  if (!date) return "-";
  try {
    return format(new Date(date), "dd MMMM yyyy", { locale: localeId });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
};
