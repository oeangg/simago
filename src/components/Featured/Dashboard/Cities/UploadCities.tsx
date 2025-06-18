// components/CsvUploadForm.tsx
"use client";

import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Papa from "papaparse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  RefreshCw,
} from "lucide-react";
import { trpc } from "@/app/_trpcClient/client";

// Schema untuk form upload
const fileUploadSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "File harus dipilih"),
});

type FileUploadTypeSchema = z.infer<typeof fileUploadSchema>;

interface UploadResult {
  success: boolean;
  message: string;
  count?: number;
}

interface CsvRow {
  [key: string]: string;
}

interface Province {
  code: string;
  name: string;
}

interface Regency {
  code: string;
  name: string;
  provinceCode: string;
}

interface District {
  code: string;
  name: string;
  regencyCode: string;
}

type DataTableItem = Province | Regency | District;

export const CsvUploadForm = () => {
  const [uploadResults, setUploadResults] = useState<{
    provinces?: UploadResult;
    regencies?: UploadResult;
    districts?: UploadResult;
  }>({});

  const [isUploading, setIsUploading] = useState<{
    provinces: boolean;
    regencies: boolean;
    districts: boolean;
  }>({ provinces: false, regencies: false, districts: false });

  // tRPC mutations
  const createProvincesMutation = trpc.City.createProvinces.useMutation();
  const createRegenciesMutation = trpc.City.createRegencies.useMutation();
  const createDistrictsMutation = trpc.City.createDistricts.useMutation();

  // tRPC queries untuk mengambil data
  const {
    data: provinces = [],
    isLoading: provincesLoading,
    refetch: refetchProvinces,
  } = trpc.City.getProvinces.useQuery<Province[]>();

  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>("");
  const [selectedRegencyCode, setSelectedRegencyCode] = useState<string>("");

  const {
    data: regencies = [],
    isLoading: regenciesLoading,
    refetch: refetchRegencies,
  } = trpc.City.getRegenciesByProvinceCode.useQuery<Regency[]>(
    { provinceCode: selectedProvinceCode },
    { enabled: !!selectedProvinceCode }
  );

  const {
    data: districts = [],
    isLoading: districtsLoading,
    refetch: refetchDistricts,
  } = trpc.City.getDistrictsByRegencyCode.useQuery<District[]>(
    { regencyCode: selectedRegencyCode },
    { enabled: !!selectedRegencyCode }
  );

  // Form untuk provinces
  const provincesForm = useForm<FileUploadTypeSchema>({
    resolver: zodResolver(fileUploadSchema),
  });

  // Form untuk regencies
  const regenciesForm = useForm<FileUploadTypeSchema>({
    resolver: zodResolver(fileUploadSchema),
  });

  // Form untuk districts
  const districtsForm = useForm<FileUploadTypeSchema>({
    resolver: zodResolver(fileUploadSchema),
  });

  // Function untuk parse CSV
  const parseCsv = (file: File): Promise<CsvRow[]> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(
              new Error("Error parsing CSV: " + results.errors[0].message)
            );
          } else {
            resolve(results.data as CsvRow[]);
          }
        },
        error: (error) => reject(error),
      });
    });
  };

  // Handle upload provinces
  const handleProvincesUpload = async (data: FileUploadTypeSchema) => {
    setIsUploading((prev) => ({ ...prev, provinces: true }));

    try {
      const file = data.file[0];
      const csvData = await parseCsv(file);

      // Transform CSV data ke format yang dibutuhkan
      const provincesData: Province[] = csvData.map((row) => ({
        code: row.code || row.Code || row.kode || row.Kode || "",
        name: row.name || row.Name || row.nama || row.Nama || "",
      }));

      const result = await createProvincesMutation.mutateAsync(provincesData);

      setUploadResults((prev) => ({
        ...prev,
        provinces: result,
      }));

      // Refresh data provinces setelah upload berhasil
      if (result.success) {
        await refetchProvinces();
      }

      provincesForm.reset();
    } catch (error) {
      setUploadResults((prev) => ({
        ...prev,
        provinces: {
          success: false,
          message: error instanceof Error ? error.message : "Terjadi kesalahan",
        },
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, provinces: false }));
    }
  };

  // Handle upload regencies
  const handleRegenciesUpload = async (data: FileUploadTypeSchema) => {
    setIsUploading((prev) => ({ ...prev, regencies: true }));

    try {
      const file = data.file[0];
      const csvData = await parseCsv(file);

      // Transform CSV data ke format yang dibutuhkan
      const regenciesData: Regency[] = csvData.map((row) => ({
        provinceCode:
          row.provinceCode || row.province_code || row.kode_provinsi || "",
        code: row.code || row.Code || row.kode || row.Kode || "",
        name: row.name || row.Name || row.nama || row.Nama || "",
      }));

      // Validasi provinceCode ada dan tidak kosong
      const invalidData = regenciesData.filter(
        (item) => !item.provinceCode || !item.code || !item.name
      );
      if (invalidData.length > 0) {
        throw new Error(
          `Ditemukan ${invalidData.length} data yang tidak lengkap. Pastikan semua kolom (provinceCode, code, name) terisi.`
        );
      }

      // Cek apakah semua provinceCode yang ada di CSV memang ada di database
      const uniqueProvinceCodes = [
        ...new Set(regenciesData.map((item) => item.provinceCode)),
      ];
      const existingProvinces = provinces.filter((province) =>
        uniqueProvinceCodes.includes(province.code)
      );

      if (existingProvinces.length !== uniqueProvinceCodes.length) {
        const missingCodes = uniqueProvinceCodes.filter(
          (code) =>
            !existingProvinces.some((province) => province.code === code)
        );
        throw new Error(
          `Province code tidak ditemukan: ${missingCodes.join(
            ", "
          )}. Pastikan data provinsi sudah diupload terlebih dahulu.`
        );
      }

      const result = await createRegenciesMutation.mutateAsync(regenciesData);

      setUploadResults((prev) => ({
        ...prev,
        regencies: result,
      }));

      // Refresh data regencies setelah upload berhasil
      if (result.success && selectedProvinceCode) {
        await refetchRegencies();
      }

      regenciesForm.reset();
    } catch (error) {
      let errorMessage = "Terjadi kesalahan";

      if (error instanceof Error) {
        if (
          error.message.includes("Foreign key constraint") ||
          error.message.includes("Regency_provinceId_fkey")
        ) {
          errorMessage =
            "Beberapa kode provinsi tidak ditemukan dalam database. Pastikan data provinsi sudah diupload terlebih dahulu dan kode provinsi di CSV sesuai.";
        } else {
          errorMessage = error.message;
        }
      }

      setUploadResults((prev) => ({
        ...prev,
        regencies: {
          success: false,
          message: errorMessage,
        },
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, regencies: false }));
    }
  };

  // Handle upload districts
  const handleDistrictsUpload = async (data: FileUploadTypeSchema) => {
    setIsUploading((prev) => ({ ...prev, districts: true }));

    try {
      const file = data.file[0];
      const csvData = await parseCsv(file);

      // Transform CSV data ke format yang dibutuhkan
      const districtsData: District[] = csvData.map((row) => ({
        regencyCode:
          row.regencyCode || row.regency_code || row.kode_kabupaten || "",
        code: row.code || row.Code || row.kode || row.Kode || "",
        name: row.name || row.Name || row.nama || row.Nama || "",
      }));

      const result = await createDistrictsMutation.mutateAsync(districtsData);

      setUploadResults((prev) => ({
        ...prev,
        districts: result,
      }));

      // Refresh data districts setelah upload berhasil
      if (result.success && selectedRegencyCode) {
        await refetchDistricts();
      }

      districtsForm.reset();
    } catch (error) {
      setUploadResults((prev) => ({
        ...prev,
        districts: {
          success: false,
          message: error instanceof Error ? error.message : "Terjadi kesalahan",
        },
      }));
    } finally {
      setIsUploading((prev) => ({ ...prev, districts: false }));
    }
  };

  const renderDataTable = <T extends DataTableItem>(
    title: string,
    data: T[],
    isLoading: boolean,
    columns: { key: keyof T; label: string }[],
    onRefresh?: () => void,
    showSelector?: {
      type: "province" | "regency";
      value: string;
      onChange: (value: string) => void;
      options: { code: string; name: string }[];
    }
  ) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>{title}</CardTitle>
            <Badge variant="secondary">{data.length} data</Badge>
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          )}
        </div>
        {showSelector && (
          <div className="flex items-center gap-2 mt-2">
            <Label htmlFor={`${showSelector.type}-select`}>
              Pilih{" "}
              {showSelector.type === "province" ? "Provinsi" : "Kabupaten/Kota"}
              :
            </Label>
            <select
              id={`${showSelector.type}-select`}
              value={showSelector.value}
              onChange={(e) => showSelector.onChange(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="">
                -- Pilih{" "}
                {showSelector.type === "province"
                  ? "Provinsi"
                  : "Kabupaten/Kota"}{" "}
                --
              </option>
              {showSelector.options.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data...</span>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showSelector && !showSelector.value
              ? `Pilih ${
                  showSelector.type === "province"
                    ? "provinsi"
                    : "kabupaten/kota"
                } untuk melihat data`
              : "Belum ada data tersedia"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">No</TableHead>
                  {columns.map((col) => (
                    <TableHead key={col.key as string}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              {/* tampilkan data */}
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={item.code || index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    {columns.map((col) => (
                      <TableCell key={col.key as string}>
                        {col.key === "code" ? (
                          <Badge variant="outline">
                            {String(item[col.key]) as React.ReactNode}
                          </Badge>
                        ) : (
                          (item[col.key] as React.ReactNode) 
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderUploadForm = (
    form: UseFormReturn<FileUploadTypeSchema>,
    onSubmit: (data: FileUploadTypeSchema) => void,
    isLoading: boolean,
    acceptedHeaders: string[],
    description: string,
    result?: UploadResult
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload File CSV
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="file">Pilih File CSV</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              {...form.register("file")}
              disabled={isLoading}
            />
            {form.formState.errors.file && (
              <p className="text-sm text-red-500 mt-1">
                {form.formState.errors.file.message}
              </p>
            )}
          </div>

          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">Header CSV yang diperlukan:</p>
            <p className="font-mono text-xs bg-gray-100 p-2 rounded">
              {acceptedHeaders.join(", ")}
            </p>
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload CSV
              </>
            )}
          </Button>
        </form>

        {result && (
          <Alert
            className={result.success ? "border-green-500" : "border-red-500"}
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <AlertDescription>
              {result.message}
              {result.count && ` (${result.count} data)`}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Upload Data Wilayah</h1>
        <p className="text-gray-600">
          Upload file CSV untuk data provinsi, kabupaten/kota, dan kecamatan
        </p>
      </div>

      <Tabs defaultValue="provinces" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provinces">Provinsi</TabsTrigger>
          <TabsTrigger value="regencies">Kabupaten/Kota</TabsTrigger>
          <TabsTrigger value="districts">Kecamatan</TabsTrigger>
        </TabsList>

        <TabsContent value="provinces" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {renderUploadForm(
                provincesForm,
                handleProvincesUpload,
                isUploading.provinces,
                ["code", "name"],
                "Upload file CSV berisi data provinsi dengan kolom code dan name",
                uploadResults.provinces
              )}
            </div>
            <div>
              {renderDataTable(
                "Data Provinsi",
                provinces,
                provincesLoading,
                [
                  { key: "code", label: "Kode" },
                  { key: "name", label: "Nama Provinsi" },
                ],
                refetchProvinces
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regencies" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {renderUploadForm(
                regenciesForm,
                handleRegenciesUpload,
                isUploading.regencies,
                ["provinceCode", "code", "name"],
                "Upload file CSV berisi data kabupaten/kota dengan kolom provinceCode, code, dan name",
                uploadResults.regencies
              )}
            </div>
            <div>
              {renderDataTable(
                "Data Kabupaten/Kota",
                regencies,
                regenciesLoading,
                [
                  { key: "code", label: "Kode" },
                  { key: "name", label: "Nama Kabupaten/Kota" },
                ],
                refetchRegencies,
                {
                  type: "province",
                  value: selectedProvinceCode,
                  onChange: setSelectedProvinceCode,
                  options: provinces,
                }
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="districts" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {renderUploadForm(
                districtsForm,
                handleDistrictsUpload,
                isUploading.districts,
                ["regencyCode", "code", "name"],
                "Upload file CSV berisi data kecamatan dengan kolom regencyCode, code, dan name",
                uploadResults.districts
              )}
            </div>
            <div>
              {renderDataTable(
                "Data Kecamatan",
                districts,
                districtsLoading,
                [
                  { key: "code", label: "Kode" },
                  { key: "name", label: "Nama Kecamatan" },
                ],
                refetchDistricts,
                {
                  type: "regency",
                  value: selectedRegencyCode,
                  onChange: setSelectedRegencyCode,
                  options: regencies,
                }
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
