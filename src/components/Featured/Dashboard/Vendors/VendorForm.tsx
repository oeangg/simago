"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/app/_trpcClient/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  User,
  MapPin,
  Phone,
  FileText,
  Mail,
  HandCoins,
  CreditCard,
  CalendarIcon,
} from "lucide-react";
import {
  AddressType,
  BankingBank,
  ContactType,
  StatusActive,
  VendorType,
} from "@prisma/client";

import {
  vendorSchema,
  VendorTypeSchema,
  vendorUpdateSchema,
  VendorUpdateTypeSchema,
} from "@/schemas/vendorSchema";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatDateForInput } from "@/tools/formatDateForInput";

interface VendorFormProps {
  vendor?: {
    id: string;
    code: string;
    name: string;
    vendorType: VendorType;
    statusActive: StatusActive;
    activeDate: Date | string;
    picName?: string | null;
    picPosition?: string | null;
    notes?: string | null;
    paymentTerms: number;
    npwpNumber?: string | null;
    npwpName?: string | null;
    npwpAddress?: string | null;
    npwpDate?: Date | string | null;
    vendorAddresses: Array<{
      id: string;
      addressType: AddressType;
      addressLine1: string;
      addressLine2?: string | null;
      zipcode?: string | null;
      isPrimaryAddress: boolean;
      countryCode: string;
      provinceCode?: string | null;
      regencyCode?: string | null;
      districtCode?: string | null;
      // vendorId: string;
    }>;
    vendorContacts: Array<{
      id: string;
      contactType: ContactType;
      name: string;
      faxNumber?: string | null;
      phoneNumber: string;
      email?: string | null;
      isPrimaryContact: boolean;
      vendorId: string;
    }>;
    vendorBankings: Array<{
      id: string;
      bankingNumber: string;
      bankingName: string;
      bankingBank: string;
      bankingBranch: string;
      isPrimaryBankingNumber: boolean;
      vendorId: string;
    }>;
  };
  mode: "create" | "edit";
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface Country {
  code: string;
  name: string;
}

interface Province {
  code: string;
  name: string;
}

interface Regency {
  code: string;
  name: string;
}

interface District {
  code: string;
  name: string;
}

const defaultAddress = {
  addressType: "HEAD_OFFICE" as AddressType,
  addressLine1: "",
  addressLine2: "",
  zipcode: "",
  isPrimaryAddress: true,
  countryCode: "ID",
  provinceCode: "",
  regencyCode: "",
  districtCode: "",
};

const defaultContact = {
  contactType: "PRIMARY" as ContactType,
  name: "",
  phoneNumber: "",
  faxNumber: "",
  email: "",
  isPrimaryContact: true,
};

const defaultBanking = {
  bankingNumber: "",
  bankingName: "",
  bankingBank: "BCA" as BankingBank,
  bankingBranch: "",
  isPrimaryBankingNumber: true,
};

const MAX_ADDRESSES = 10;

type VendorTypeFormData = VendorTypeSchema | VendorUpdateTypeSchema;

// Type guard untuk check apakah data memiliki id (untuk update)
function isUpdateData(
  data: VendorTypeFormData
): data is VendorUpdateTypeSchema {
  return "id" in data;
}

export function VendorForm({
  vendor,
  mode,
  onSuccess,
  onCancel,
}: VendorFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    data: vendorData,
    isLoading: isLoadingVendor,
    isPending: isPendingVendor,
  } = trpc.Vendor.getVendorById.useQuery(
    { id: vendor?.id || "" },
    { enabled: mode === "edit" && !!vendor?.id }
  );

  // Fetch countries
  const { data: countries = [] } = trpc.City.getCountries.useQuery();

  // Fetch provinces
  const { data: provinces = [] } = trpc.City.getProvinces.useQuery();

  // Initialize form default values
  const getDefaultValues = useCallback((): VendorTypeFormData => {
    if (mode === "edit" && vendorData) {
      return {
        id: vendorData.id,
        code: vendorData.code,
        name: vendorData.name,
        vendorType: vendorData.vendorType,
        statusActive: vendorData.statusActive,
        activeDate: formatDateForInput(vendorData.activeDate),
        notes: vendorData.notes || "",
        picName: vendorData.picName || "",
        picPosition: vendorData.picPosition || "",
        paymentTerms: vendorData.paymentTerms,
        npwpNumber: vendorData.npwpNumber || "",
        npwpName: vendorData.npwpName || "",
        npwpAddress: vendorData.npwpAddress || "",
        npwpDate: formatDateForInput(vendorData.npwpDate),
        vendorAddresses: vendorData.vendorAddresses.map((addr) => ({
          id: addr.id,
          addressType: addr.addressType,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2 || "",
          zipcode: addr.zipcode || "",
          isPrimaryAddress: addr.isPrimaryAddress,
          countryCode: addr.countryCode,
          provinceCode: addr.provinceCode || "",
          regencyCode: addr.regencyCode || "",
          districtCode: addr.districtCode || "",
          vendorId: addr.vendorId,
        })),
        vendorContacts: vendorData.vendorContacts.map((ctc) => ({
          id: ctc.id,
          contactType: ctc.contactType,
          name: ctc.name,
          phoneNumber: ctc.phoneNumber,
          faxNumber: ctc.faxNumber || "",
          email: ctc.email || "",
          isPrimaryContact: ctc.isPrimaryContact,
          vendorId: ctc.vendorId,
        })),
        vendorBankings: vendorData.vendorBankings.map((bank) => ({
          id: bank.id,
          bankingNumber: bank.bankingNumber,
          bankingName: bank.bankingName,
          bankingBank: bank.bankingBank,
          bankingBranch: bank.bankingBranch,
          isPrimaryBankingNumber: bank.isPrimaryBankingNumber,
          vendorId: bank.vendorId,
        })),
      };
    }

    return {
      code: "",
      name: "",
      vendorType: "LOGISTIC" as VendorType,
      statusActive: "ACTIVE" as StatusActive,
      activeDate: new Date().toISOString().split("T")[0], //today
      notes: "",
      paymentTerms: 0,
      picName: "",
      picPosition: "",
      npwpNumber: "",
      npwpName: "",
      npwpAddress: "",
      npwpDate: "",
      vendorAddresses: [{ ...defaultAddress }],
      vendorContacts: [{ ...defaultContact }],
      vendorBankings: [{ ...defaultBanking }],
    };
  }, [vendorData, mode]);

  // Initialize form

  const resolver =
    mode === "create"
      ? (zodResolver(vendorSchema) as Resolver<VendorTypeSchema>)
      : (zodResolver(vendorUpdateSchema) as Resolver<VendorUpdateTypeSchema>);

  const form = useForm<VendorTypeFormData>({
    resolver: resolver as Resolver<VendorTypeFormData>,
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Re-initialize form (edit mode)
  useEffect(() => {
    if (mode === "edit" && vendorData && !isPendingVendor) {
      form.reset(getDefaultValues());
    }
  }, [vendorData, mode, isPendingVendor, form, getDefaultValues]);

  // Get form state
  const { isDirty, isValid } = form.formState;

  // Field arrays
  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: "vendorAddresses",
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control: form.control,
    name: "vendorContacts",
  });

  const {
    fields: bankingFields,
    append: appendBanking,
    remove: removeBanking,
  } = useFieldArray({
    control: form.control,
    name: "vendorBankings",
  });

  // Watch  and address for conditional rendering
  const watchedAddresses = form.watch("vendorAddresses");

  // tRPC utils
  const utils = trpc.useUtils();

  // Function untuk fetch regencies distict

  const regencyQueries = Array.from({ length: MAX_ADDRESSES }, (_, index) => {
    const address = watchedAddresses?.[index];
    return trpc.City.getRegenciesByProvinceCode.useQuery(
      { provinceCode: address?.provinceCode || "" },
      {
        enabled:
          !!address?.provinceCode &&
          address?.countryCode === "ID" &&
          index < addressFields.length,
        staleTime: 5 * 60 * 1000,
      }
    );
  });

  const districtQueries = Array.from({ length: MAX_ADDRESSES }, (_, index) => {
    const address = watchedAddresses?.[index];
    return trpc.City.getDistrictsByRegencyCode.useQuery(
      { regencyCode: address?.regencyCode || "" },
      {
        enabled:
          !!address?.regencyCode &&
          address?.countryCode === "ID" &&
          index < addressFields.length,
        staleTime: 5 * 60 * 1000,
      }
    );
  });

  // Mutations
  const createMutation = trpc.Vendor.createAllVendor.useMutation({
    onSuccess: () => {
      toast.success("Data Vendor berhasil dibuat");
      utils.Vendor.getAllVendors.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/vendor");
      }
    },
    onError: (error) => {
      console.error("Create Vendor error:", error);
      toast.error(error.message || "Gagal membuat data vendor");
    },
  });

  const updateMutation = trpc.Vendor.updateAllVendor.useMutation({
    onSuccess: () => {
      toast.success("Vendor berhasil diperbarui");
      utils.Vendor.getAllVendors.invalidate();
      utils.Vendor.getVendorById.invalidate({ id: vendor?.id });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/vendor");
      }
    },
    onError: (error) => {
      console.error("Update data vendor error:", error);
      toast.error(error.message || "Gagal memperbarui data vendor");
    },
  });

  // Handle province change - reset regencycode
  const handleProvinceChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`vendorAddresses.${index}.provinceCode`, value);
      form.setValue(`vendorAddresses.${index}.regencyCode`, "");
      form.setValue(`vendorAddresses.${index}.districtCode`, "");
    },
    [form]
  );

  // Handle regency change - reset district code
  const handleRegencyChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`vendorAddresses.${index}.regencyCode`, value);
      form.setValue(`vendorAddresses.${index}.districtCode`, "");
    },
    [form]
  );

  // Handle country change - reset city code
  const handleCountryChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`vendorAddresses.${index}.countryCode`, value);

      // Jika country ID
      if (value !== "ID") {
        form.setValue(`vendorAddresses.${index}.provinceCode`, "");
        form.setValue(`vendorAddresses.${index}.regencyCode`, "");
        form.setValue(`vendorAddresses.${index}.districtCode`, "");
      }
    },
    [form]
  );

  // Submit handler
  const onSubmitVendor = async (data: VendorTypeFormData) => {
    setIsLoading(true);
    try {
      const submitData = data;

      if (mode === "create" && !isUpdateData(data)) {
        await createMutation.mutateAsync(submitData as VendorTypeSchema);
      } else if (mode === "edit" && isUpdateData(data)) {
        await updateMutation.mutateAsync(submitData as VendorUpdateTypeSchema);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle primary selection
  const handlePrimaryAddress = useCallback(
    (index: number) => {
      addressFields.forEach((_, i) => {
        form.setValue(`vendorAddresses.${i}.isPrimaryAddress`, i === index);
      });
    },
    [addressFields, form]
  );

  const handlePrimaryContact = useCallback(
    (index: number) => {
      contactFields.forEach((_, i) => {
        form.setValue(`vendorContacts.${i}.isPrimaryContact`, i === index);
      });
    },
    [contactFields, form]
  );

  const handlePrimaryBanking = useCallback(
    (index: number) => {
      bankingFields.forEach((_, i) => {
        form.setValue(
          `vendorBankings.${i}.isPrimaryBankingNumber`,
          i === index
        );
      });
    },
    [bankingFields, form]
  );

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard/vendor");
    }
  };

  // Handle add actions
  const handleAddAddress = useCallback(() => {
    appendAddress({ ...defaultAddress, isPrimaryAddress: false });
  }, [appendAddress]);

  const handleAddContact = useCallback(() => {
    appendContact({ ...defaultContact, isPrimaryContact: false });
  }, [appendContact]);

  const handleAddBanking = useCallback(() => {
    appendBanking({ ...defaultBanking, isPrimaryBankingNumber: false });
  }, [appendBanking]);

  // Handle remove address with primary address validation
  const handleRemoveAddress = useCallback(
    (index: number) => {
      const currentAddresses = form.getValues("vendorAddresses");
      if (!currentAddresses || currentAddresses.length <= 1) return;

      const addressToRemove = currentAddresses[index];
      removeAddress(index);

      // If remove primary address, set first remaining address as primary
      if (addressToRemove?.isPrimaryAddress) {
        const newPrimaryIndex = index === 0 ? 0 : 0;
        setTimeout(() => {
          form.setValue(
            `vendorAddresses.${newPrimaryIndex}.isPrimaryAddress`,
            true
          );
        }, 0);
      }
    },
    [form, removeAddress]
  );

  // Handle remove contact with primary contact validation
  const handleRemoveContact = useCallback(
    (index: number) => {
      const currentContacts = form.getValues("vendorContacts");
      if (!currentContacts || currentContacts.length <= 1) return;

      const contactToRemove = currentContacts[index];
      removeContact(index);

      // If removing primary contact, set first remaining contact as primary
      if (contactToRemove?.isPrimaryContact) {
        const newPrimaryIndex = index === 0 ? 0 : 0;
        setTimeout(() => {
          form.setValue(
            `vendorContacts.${newPrimaryIndex}.isPrimaryContact`,
            true
          );
        }, 0);
      }
    },
    [form, removeContact]
  );

  const handleRemoveBanking = useCallback(
    (index: number) => {
      const currentBankings = form.getValues("vendorBankings");
      if (!currentBankings || currentBankings.length <= 1) return;

      const bankingToRemove = currentBankings[index];
      removeBanking(index);

      // If removing primary banking, set first remaining banking as primary
      if (bankingToRemove?.isPrimaryBankingNumber) {
        const newPrimaryIndex = index === 0 ? 0 : 0;
        setTimeout(() => {
          form.setValue(
            `vendorBankings.${newPrimaryIndex}.isPrimaryBankingNumber`,
            true
          );
        }, 0);
      }
    },
    [form, removeBanking]
  );

  if (mode === "edit" && (isLoadingVendor || isPendingVendor)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitVendor)} className="space-y-6">
        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Vendor
            </CardTitle>
            <CardDescription>Masukkan informasi dasar Vendor</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kode Vendor <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ex : VEN-001"
                        {...field}
                        disabled={mode === "edit"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Vendor <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama Vendor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="vendorType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipe Vendor <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe vendor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOGISTIC">Logistik</SelectItem>
                        <SelectItem value="SERVICES">Jasa/Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Terms of Payment (hari){" "}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <HandCoins className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="number"
                          placeholder="0"
                          className="pl-5"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 border p-4 rounded-lg ">
              <FormField
                control={form.control}
                name="activeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Aktif</FormLabel>
                    <FormControl>
                      <div className="flex items-center px-3 py-2 border border-input bg-background rounded-md">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {/* new Date().toISOString().split("T")[0]
                          {field.value
                            ? format(new Date(field.value), "dd MMMM yyyy", {
                                locale: id,
                              })
                            : "Tanggal belum diset"} */}
                          {field.value
                            ? format(new Date(field.value), "dd MMMM yyyy", {
                                locale: id,
                              })
                            : "Tanggal belum diset"}
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="statusActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={mode !== "edit"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ACTIVE">
                          <Badge className="bg-green-500">Active</Badge>
                        </SelectItem>
                        <SelectItem value="NOACTIVE">
                          <Badge variant="destructive">No Active</Badge>
                        </SelectItem>
                        <SelectItem value="SUSPENDED">
                          <Badge className="bg-yellow-500">Ditangguhkan</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="picName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama PIC</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama PIC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="picPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan PIC</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan jabatan PIC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan catatan tambahan..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* NPWP Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informasi NPWP
            </CardTitle>
            <CardDescription>
              Tambahkan informasi NPWP Supplier (opsional)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="npwpNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nomor NPWP</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan Nomor NPWP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="npwpName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama NPWP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan nama sesuai NPWP"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="npwpAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat NPWP</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Masukkan Alamat sesuai NPWP..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="npwpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal NPWP</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Banking Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informasi Bank
                </CardTitle>
                <CardDescription>
                  Tambahkan informasi rekening bank vendor (minimal 1 rekening)
                  <span className="text-red-500">*</span>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBanking}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Rekening
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {bankingFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border p-4 space-y-4 relative"
              >
                {bankingFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemoveBanking(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">Rekening {index + 1}</span>

                  <FormField
                    control={form.control}
                    name={`vendorBankings.${index}.isPrimaryBankingNumber`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroup
                            value={field.value ? "true" : "false"}
                            onValueChange={() => handlePrimaryBanking(index)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" />
                              <Label className="text-sm font-normal cursor-pointer">
                                Rekening Utama
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`vendorBankings.${index}.bankingNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nomor Rekening <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nomor rekening"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`vendorBankings.${index}.bankingName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nama Pemilik Rekening{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama pemilik rekening"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`vendorBankings.${index}.bankingBank`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Bank <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih bank" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="BCA">BCA</SelectItem>
                            <SelectItem value="BNI">BNI</SelectItem>
                            <SelectItem value="BRI">BRI</SelectItem>
                            <SelectItem value="MANDIRI">Mandiri</SelectItem>
                            <SelectItem value="BNI_SYARIAH">
                              BNI Syariah
                            </SelectItem>
                            <SelectItem value="DANAMON">Danamon</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`vendorBankings.${index}.bankingBranch`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Cabang Bank <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama cabang bank"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Add Addresses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Alamat
                </CardTitle>
                <CardDescription>
                  Tambahkan alamat vendor (minimal 1 alamat)
                  <span className="text-red-500">*</span>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAddress}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Alamat
              </Button>
            </div>
          </CardHeader>
          {/* Address */}
          <CardContent className="space-y-4">
            {addressFields.map((field, index) => {
              // Get data for this specific index
              const regencies = regencyQueries[index]?.data || [];
              const districts = districtQueries[index]?.data || [];

              return (
                <div
                  key={field.id}
                  className="rounded-lg border p-4 space-y-4 relative"
                >
                  {addressFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => handleRemoveAddress(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="font-medium">Alamat {index + 1}</span>

                    <FormField
                      control={form.control}
                      name={`vendorAddresses.${index}.isPrimaryAddress`}
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroup
                              value={field.value ? "true" : "false"}
                              onValueChange={() => handlePrimaryAddress(index)}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" />
                                <Label className="text-sm font-normal cursor-pointer">
                                  Alamat Utama
                                </Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`vendorAddresses.${index}.addressType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Tipe Alamat <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe alamat" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="HEAD_OFFICE">
                                Kantor Pusat
                              </SelectItem>
                              <SelectItem value="BRANCH">Cabang</SelectItem>
                              <SelectItem value="WAREHOUSE">Gudang</SelectItem>
                              <SelectItem value="BILLING">
                                Alamat Penagihan
                              </SelectItem>
                              <SelectItem value="SHIPPING">
                                Alamat Pengiriman
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`vendorAddresses.${index}.countryCode`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Negara <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              handleCountryChange(value, index);
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih negara" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {countries.map((country: Country) => (
                                <SelectItem
                                  key={country.code}
                                  value={country.code}
                                >
                                  {country.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name={`vendorAddresses.${index}.addressLine1`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Alamat Baris 1 <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan Alamat baris ke-1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`vendorAddresses.${index}.addressLine2`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat Baris 2</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan Alamat baris ke-2"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Show province, regency, district only for domestic (ID) */}
                  {watchedAddresses?.[index]?.countryCode === "ID" && (
                    <div className="grid gap-4 md:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`vendorAddresses.${index}.provinceCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Provinsi <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                handleProvinceChange(value, index);
                              }}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih provinsi" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {provinces?.map((province: Province) => (
                                  <SelectItem
                                    key={province.code}
                                    value={province.code}
                                  >
                                    {province.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`vendorAddresses.${index}.regencyCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Kabupaten/Kota{" "}
                              <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={(value) => {
                                handleRegencyChange(value, index);
                              }}
                              value={field.value}
                              disabled={!regencies.length}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kabupaten/kota" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {regencies.map((regency: Regency) => (
                                  <SelectItem
                                    key={regency.code}
                                    value={regency.code}
                                  >
                                    {regency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`vendorAddresses.${index}.districtCode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Kecamatan <span className="text-red-500">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              disabled={!districts.length}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih kecamatan" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {districts.map((district: District) => (
                                  <SelectItem
                                    key={district.code}
                                    value={district.code}
                                  >
                                    {district.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Show message for Vendor non ID */}
                  {watchedAddresses?.[index]?.countryCode !== "ID" && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Catatan:</strong> Untuk Vendor Luar Indonesia
                        (ID), cukup isi alamat lengkap di field &rdquo;Alamat
                        Baris 1&rdquo; dan &rdquo;Alamat Baris 2&rdquo;.
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name={`vendorAddresses.${index}.zipcode`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kode Pos</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan kodepos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Kontak
                </CardTitle>
                <CardDescription>
                  Tambahkan kontak vendor (minimal 1 kontak)
                  <span className="text-red-500">*</span>
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddContact}
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kontak
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {contactFields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border p-4 space-y-4 relative"
              >
                {contactFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={() => handleRemoveContact(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-medium">Kontak {index + 1}</span>

                  <FormField
                    control={form.control}
                    name={`vendorContacts.${index}.isPrimaryContact`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroup
                            value={field.value ? "true" : "false"}
                            onValueChange={() => handlePrimaryContact(index)}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" />
                              <Label className="text-sm font-normal cursor-pointer">
                                Kontak Utama
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`vendorContacts.${index}.contactType`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Tipe Kontak <span className="text-red-500">*</span>
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih tipe kontak" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PRIMARY">
                              Kontak Utama
                            </SelectItem>
                            <SelectItem value="BILLING">
                              Kontak Penagihan
                            </SelectItem>
                            <SelectItem value="SHIPPING">
                              Kontak Pengiriman
                            </SelectItem>
                            <SelectItem value="EMERGENCY">
                              Kontak Darurat
                            </SelectItem>
                            <SelectItem value="TECHNICAL">
                              Kontak Teknis
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`vendorContacts.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nama Kontak <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nama Kontak"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`vendorContacts.${index}.phoneNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Nomor Telepon <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Masukkan nomor telpon"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`vendorContacts.${index}.faxNumber`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Fax</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan nomor Fax" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`vendorContacts.${index}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Contoh : email@gmail.com"
                            className="pl-5"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-2 mr-auto text-sm text-muted-foreground">
            {isDirty && (
              <Badge variant="outline" className="bg-yellow-50">
                Ada perubahan yang belum disimpan
              </Badge>
            )}
            {!isValid && isDirty && (
              <Badge variant="outline" className="bg-red-50">
                Silakan lengkapi field yang diperlukan
              </Badge>
            )}
            {!isDirty && !isValid && mode === "create" && (
              <Badge variant="outline" className="bg-blue-50">
                Lengkapi semua field wajib{" "}
                <span className="text-red-500"> (*)</span>
              </Badge>
            )}
            {mode === "edit" && !isDirty && (
              <Badge variant="outline" className="bg-gray-50">
                Belum ada perubahan
              </Badge>
            )}
            {mode === "edit" && isDirty && !isValid && (
              <Badge variant="outline" className="bg-red-50">
                Silakan lengkapi field yang diperlukan
              </Badge>
            )}
            {mode === "edit" && isDirty && isValid && (
              <Badge variant="outline" className="bg-green-50">
                Siap untuk disimpan
              </Badge>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !isValid || (mode === "edit" && !isDirty)}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {mode === "create" ? "Simpan Vendor" : "Update Vendor"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
