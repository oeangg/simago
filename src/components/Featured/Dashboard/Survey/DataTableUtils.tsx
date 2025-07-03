import { format } from "date-fns";
import { SurveyInColumnsProps } from "./Columns";

// Type guard untuk memastikan data adalah SupplierColumnsProps
export function isSurveyData(data: unknown): data is SurveyInColumnsProps {
  return (
    typeof data === "object" &&
    data !== null &&
    "surveyNo" in data &&
    "surveyDate" in data &&
    "workDate" in data &&
    "origin" in data &&
    "destination" in data
  );
}

// Utility function untuk mendapatkan data dari row dengan type safety
export function getSurveyInFromRow<T>(row: {
  original: T;
}): SurveyInColumnsProps {
  const survey = row.original;

  if (!isSurveyData(survey)) {
    throw new Error("Invalid survey data structure");
  }

  return survey;
}

// Search utility function
// Simple search utility function (sesuai dengan router)
export function searchSurvey(
  survey: SurveyInColumnsProps,
  searchTerm: string
): boolean {
  const search = searchTerm.toLowerCase().trim();

  if (!search) return true;

  // Search in main fields only (like in the router)
  return (
    survey.surveyNo?.toLowerCase().includes(search) ||
    survey.origin.toLowerCase().includes(search) ||
    survey.destination.toLowerCase().includes(search) ||
    format(new Date(survey.surveyDate), "dd/MM/yyyy").includes(search) ||
    format(new Date(survey.workDate), "dd/MM/yyyy").includes(search)
  );
}
