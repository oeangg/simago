import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
  Image,
} from "@react-pdf/renderer";
import { trpc } from "@/app/_trpcClient/client";
import { toast } from "sonner";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, Loader2 } from "lucide-react";

// Register a font, if you haven't already.
// For a production application, you should ensure these fonts are available.
// For example, you can self-host them or link to them.
// If not registered, Helvetica is a good default.
try {
  Font.register({
    family: "Helvetica",
    fonts: [
      { src: "/fonts/Helvetica.ttf" },
      { src: "/fonts/Helvetica-Bold.ttf", fontWeight: "bold" },
    ],
  });
} catch (error) {
  console.warn(
    "Font Helvetica already registered or could not be loaded.",
    error
  );
}

interface SurveyPrintData {
  id: string;
  surveyNo: string;
  surveyDate: Date;
  workDate: Date;
  customerId: string;
  origin: string;
  destination: string;
  cargoType: string;
  shipmentType: string;
  shipmentDetail: string;
  statusSurvey: string;
  customers: {
    id: string;
    code: string;
    name: string;
    contacts?: Array<{
      name: string;
      email?: string | null;
      phoneNumber: string;
    }>;
  };
  surveyItems: Array<{
    id: string;
    name: string;
    width: number;
    length: number;
    height: number;
    quantity: number;
    cbm: number;
    note: string | null;
  }>;
}

// ==========================================
// 📄 PDF STYLES (Clean & Professional)
// ==========================================

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
    borderBottom: "3pt solid #2563eb",
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 10,
  },
  surveyNo: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  infoSection: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 20,
  },
  infoCard: {
    flex: 1,
    border: "1pt solid #e5e7eb",
    borderRadius: 5,
    padding: 15,
    backgroundColor: "#f9fafb",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 5,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 10,
    color: "#6b7280",
    width: "40%",
    fontWeight: "bold",
  },
  infoValue: {
    fontSize: 10,
    color: "#1f2937",
    width: "60%",
  },
  routeSection: {
    backgroundColor: "#f3f4f6",
    padding: 15,
    marginBottom: 20,
    textAlign: "center",
    borderRadius: 5,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 5,
  },
  routeText: {
    fontSize: 12,
    color: "#1f2937",
  },
  tableContainer: {
    marginTop: 15,
  },
  tableTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 10,
  },
  table: {
    // Removed display: "table" and replaced with flexbox for table-like structure
    flexDirection: "column", // Organize rows vertically
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableRow: {
    flexDirection: "row", // Each row is a horizontal flex container
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    // To ensure the last row doesn't have a bottom border if preferred
    // If you want a border on the last row, remove this
    "&:last-child": {
      borderBottomWidth: 0,
    },
  },
  tableHeader: {
    backgroundColor: "#2563eb",
    borderBottomWidth: 1,
    borderBottomColor: "#1d4ed8",
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 9,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    borderStyle: "solid",
    borderWidth: 1, // Individual cell borders
    borderColor: "#1d4ed8",
    flexGrow: 1, // Allow cells to grow
    flexShrink: 0, // Prevent cells from shrinking
  },
  tableCell: {
    padding: 6,
    fontSize: 8,
    textAlign: "center",
    borderStyle: "solid",
    borderWidth: 1, // Individual cell borders
    borderColor: "#e5e7eb",
    flexGrow: 1, // Allow cells to grow
    flexShrink: 0, // Prevent cells from shrinking
  },
  tableCellLeft: {
    textAlign: "left",
  },
  summarySection: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: 15,
    marginTop: 20,
    textAlign: "center",
    borderRadius: 5,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 11,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: "1pt solid #e5e7eb",
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#6b7280",
  },
  statusBadge: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
    padding: 3,
    borderRadius: 3,
    fontSize: 8,
    fontWeight: "bold",
  },
  logo: {
    width: 185, // Atur lebar gambar
    height: 60, // Atur tinggi gambar
    marginBottom: 10,
    alignSelf: "center", // Untuk menengahkan gambar di dalam View header
  },
});

// ==========================================
// 🎨 PDF DOCUMENT COMPONENT
// ==========================================

interface SurveyPDFProps {
  surveyData: SurveyPrintData;
}

export const SurveyPDFDocument = ({ surveyData }: SurveyPDFProps) => {
  if (!surveyData) return null;

  const formatDate = (date: Date): string => {
    try {
      return new Date(date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const getStatusBadge = (
    status: string
  ): { label: string; bg: string; color: string } => {
    const statusMap: Record<
      string,
      { label: string; bg: string; color: string }
    > = {
      ONPROGRESS: { label: "On Progress", bg: "#dbeafe", color: "#1e40af" },
      APPROVED: { label: "Approved", bg: "#dcfce7", color: "#166534" },
      REJECT: { label: "Rejected", bg: "#fee2e2", color: "#dc2626" },
    };
    return (
      statusMap[status] || { label: status, bg: "#f3f4f6", color: "#374151" }
    );
  };

  const primaryContact = surveyData.customers?.contacts?.[0];
  const totalItems = surveyData.surveyItems?.length || 0;
  const totalQuantity =
    surveyData.surveyItems?.reduce(
      (sum: number, item: { quantity: number }) => sum + (item.quantity || 0),
      0
    ) || 0;
  const totalCBM =
    surveyData.surveyItems?.reduce(
      (sum: number, item: { cbm: number }) => sum + (item.cbm || 0),
      0
    ) || 0;
  const statusInfo = getStatusBadge(surveyData.statusSurvey);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image src="/logo/logo.PNG" style={styles.logo} />
          <Text style={styles.title}>CARGO SURVEY FORM</Text>
          <Text style={styles.surveyNo}>{surveyData.surveyNo}</Text>
        </View>

        {/* Survey & Customer Information */}
        <View style={styles.infoSection}>
          {/* Survey Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Survey Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Survey Date:</Text>
              <Text style={styles.infoValue}>
                {formatDate(surveyData.surveyDate)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Work Date:</Text>
              <Text style={styles.infoValue}>
                {formatDate(surveyData.workDate)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Status:</Text>
              <Text style={[styles.infoValue, { color: statusInfo.color }]}>
                {statusInfo.label}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cargo Type:</Text>
              <Text style={styles.infoValue}>{surveyData.cargoType}</Text>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Customer Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Company:</Text>
              <Text style={styles.infoValue}>
                {surveyData.customers?.name || "N/A"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Code:</Text>
              <Text style={styles.infoValue}>
                {surveyData.customers?.code || "N/A"}
              </Text>
            </View>
            {primaryContact && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>PIC:</Text>
                  <Text style={styles.infoValue}>{primaryContact.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>
                    {primaryContact.phoneNumber}
                  </Text>
                </View>
                {primaryContact.email && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{primaryContact.email}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Route Information */}
        <View style={styles.routeSection}>
          <Text style={styles.routeTitle}>
            {surveyData.origin} → {surveyData.destination}
          </Text>
          <Text style={styles.routeText}>
            {surveyData.shipmentType} • {surveyData.shipmentDetail}
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableTitle}>Survey Items Details</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableHeaderCell, { width: "8%" }]}>No</Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                Item Name
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "20%" }]}>
                Dimensions (cm)
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "10%" }]}>
                Qty
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "12%" }]}>
                CBM
              </Text>
              <Text style={[styles.tableHeaderCell, { width: "25%" }]}>
                Notes
              </Text>
            </View>

            {/* Table Rows */}
            {surveyData.surveyItems?.map(
              (item: SurveyPrintData["surveyItems"][number], index: number) => (
                <View key={item.id || index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: "8%" }]}>
                    {index + 1}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellLeft,
                      { width: "25%" },
                    ]}
                  >
                    {item.name || "N/A"}
                  </Text>
                  <Text style={[styles.tableCell, { width: "20%" }]}>
                    {item.width} × {item.length} × {item.height}
                  </Text>
                  <Text style={[styles.tableCell, { width: "10%" }]}>
                    {item.quantity}
                  </Text>
                  <Text style={[styles.tableCell, { width: "12%" }]}>
                    {(item.cbm || 0).toFixed(4)} m³
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      styles.tableCellLeft,
                      { width: "25%" },
                    ]}
                  >
                    {item.note || "-"}
                  </Text>
                </View>
              )
            ) || []}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>Survey Summary</Text>
          <Text style={styles.summaryText}>
            Total Items: {totalItems} | Total Quantity: {totalQuantity} | Total
            Volume: {totalCBM.toFixed(4)} m³
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated on: {new Date().toLocaleDateString("id-ID")} at{" "}
            {new Date().toLocaleTimeString("id-ID")}
          </Text>
          <Text style={styles.footerText}>
            System Management Cargo - SIMAGO Documentation
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// ==========================================
// 🎯 SURVEY PDF HOOK
// ==========================================

export const useSurveyPDF = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [surveyData, setSurveyData] = useState<SurveyPrintData | null>(null);
  const utils = trpc.useUtils();

  const generatePDF = async (survey: {
    id: string;
  }): Promise<SurveyPrintData> => {
    try {
      setIsLoading(true);
      toast.loading("Preparing PDF...", { id: "pdf-gen" });

      const data = await utils.survey.getSurveyById.fetch({
        id: survey.id,
      });

      if (!data) {
        throw new Error("Survey data not found");
      }

      setSurveyData(data);
      toast.dismiss("pdf-gen");

      return data as SurveyPrintData; // Cast to the correct type
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async (survey: { id: string }) => {
    try {
      const data = await generatePDF(survey);

      // Generate PDF blob
      const doc = <SurveyPDFDocument surveyData={data} />;
      const blob = await pdf(doc).toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Survey-${data.surveyNo}.pdf`;
      link.click();

      // Cleanup
      URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.log(error);
      // Error already handled in generatePDF
    }
  };

  const openPDF = async (survey: { id: string }) => {
    try {
      const data = await generatePDF(survey);

      // Generate PDF blob
      const doc = <SurveyPDFDocument surveyData={data} />;
      const blob = await pdf(doc).toBlob();

      // Open in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      toast.success("PDF opened in new tab!");
    } catch (error) {
      console.log(error);
      // Error already handled in generatePDF
    }
  };

  return {
    generatePDF,
    downloadPDF,
    openPDF,
    isLoading,
    surveyData,
  };
};

interface SurveyPDFButtonProps {
  survey: { id: string }; // More specific type for survey prop
  variant?: "download" | "open" | "both";
}

export const SurveyPDFButton = ({
  survey,
  variant = "both",
}: SurveyPDFButtonProps) => {
  const { downloadPDF, openPDF, isLoading } = useSurveyPDF();

  if (variant === "download" || variant === "both") {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => downloadPDF(survey)}
          disabled={isLoading}
          size="sm"
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download PDF
        </Button>

        {variant === "both" && (
          <Button
            onClick={() => openPDF(survey)}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            View PDF
          </Button>
        )}
      </div>
    );
  }

  return (
    <Button
      onClick={() => openPDF(survey)}
      disabled={isLoading}
      size="sm"
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      View PDF
    </Button>
  );
};
