export const formatDateForInput = (
  date: Date | string | null | undefined,
  options?: {
    defaultValue?: string; // Custom default
    isRequired?: boolean; // Required field handling
  }
): string => {
  // Jika tidak ada date
  if (!date) {
    // Return default value jika disediakan
    return options?.defaultValue || "";
  }

  // Handle Date object
  if (date instanceof Date) {
    return date.toISOString().split("T")[0];
  }

  // Handle string
  if (typeof date === "string") {
    // Already in correct format
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Try to parse and reformat
    try {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    } catch {
      // Invalid date
    }
  }

  return options?.defaultValue || "";
};
