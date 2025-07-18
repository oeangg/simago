"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  Warehouse,
  HandCoins,
} from "lucide-react";
import {
  AddressType,
  ContactType,
  StatusActive,
  SupplierType,
} from "@prisma/client";

import {
  supplierSchema,
  SupplierTypeSchema,
  supplierUpdateSchema,
  SupplierUpdateTypeSchema,
} from "@/schemas/supplierSchema";
import { formatDateForInput } from "@/tools/formatDateForInput";

interface SupplierFormProps {
  supplier?: {
    id: string;
    code: string;
    name: string;
    supplierType: SupplierType;
    statusActive: StatusActive;
    activeDate: Date | string;
    notes?: string | null;
    npwpNumber?: string | null;
    npwpName?: string | null;
    npwpAddress?: string | null;
    npwpDate?: Date | string | null;
    addresses: Array<{
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
    }>;
    contacts: Array<{
      id: string;
      contactType: ContactType;
      name: string;
      phoneNumber: string;
      email?: string | null;
      isPrimaryContact: boolean;
      supplierId: string;
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
  email: "",
  isPrimaryContact: true,
};

const MAX_ADDRESSES = 10;

export function SupplierForm({
  supplier,
  mode,
  onSuccess,
  onCancel,
}: SupplierFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch supplier data if in edit mode
  const {
    data: supplierData,
    isLoading: isLoadingSupplier,
    isPending: isPendingSupplier,
  } = trpc.Supplier.getSupplier.useQuery(
    { id: supplier?.id || "" },
    { enabled: mode === "edit" && !!supplier?.id }
  );

  // Fetch countries
  const { data: countries = [] } = trpc.City.getCountries.useQuery();

  // Fetch provinces
  const { data: provinces = [] } = trpc.City.getProvinces.useQuery();

  // Initialize form default values
  const getDefaultValues = useCallback(() => {
    if (mode === "edit" && supplierData) {
      return {
        id: supplierData.id,
        code: supplierData.code,
        name: supplierData.name,
        supplierType: supplierData.supplierType,
        statusActive: supplierData.statusActive,
        activeDate: formatDateForInput(supplierData.activeDate),
        notes: supplierData.notes || "",
        npwpNumber: supplierData.npwpNumber || "",
        npwpName: supplierData.npwpName || "",
        npwpAddress: supplierData.npwpAddress || "",
        npwpDate: formatDateForInput(supplierData.npwpDate),
        addresses: supplierData.addresses.map((addr) => ({
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
        })),
        contacts: supplierData.contacts.map((ctc) => ({
          id: ctc.id,
          contactType: ctc.contactType,
          name: ctc.name,
          phoneNumber: ctc.phoneNumber,
          email: ctc.email || "",
          isPrimaryContact: ctc.isPrimaryContact,
          supplierId: ctc.supplierId,
        })),
      };
    }

    return {
      code: "",
      name: "",
      supplierType: "LOGISTIC" as SupplierType,
      activeDate: new Date().toISOString().split("T")[0],
      statusActive: "ACTIVE" as StatusActive,
      notes: "",
      npwpNumber: "",
      npwpName: "",
      npwpAddress: "",
      npwpDate: "",
      addresses: [{ ...defaultAddress }],
      contacts: [{ ...defaultContact }],
    };
  }, [supplierData, mode]);

  // Initialize form
  const form = useForm<SupplierTypeSchema>({
    resolver: zodResolver(
      mode === "create" ? supplierSchema : supplierUpdateSchema
    ),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Re-initialize form (edit mode)
  useEffect(() => {
    if (mode === "edit" && supplierData && !isPendingSupplier) {
      form.reset(getDefaultValues());
    }
  }, [supplierData, mode, isPendingSupplier, form, getDefaultValues]);

  // Get form state
  const { isDirty, isValid } = form.formState;

  // Field arrays
  const {
    fields: addressFields,
    append: appendAddress,
    remove: removeAddress,
  } = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact,
  } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  // Watch supplier type and address for conditional rendering
  const watchedAddresses = form.watch("addresses");

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
  const createMutation = trpc.Supplier.createAllSupplier.useMutation({
    onSuccess: () => {
      toast.success("Data Supplier berhasil dibuat");
      utils.Supplier.getAllSuppliers.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/supplier");
      }
    },
    onError: (error) => {
      console.error("Create Supplier error:", error);
      toast.error(error.message || "Gagal membuat data supplier");
    },
  });

  const updateMutation = trpc.Supplier.updateAllSupplier.useMutation({
    onSuccess: () => {
      toast.success("Supplier berhasil diperbarui");
      utils.Supplier.getAllSuppliers.invalidate();
      utils.Supplier.getSupplier.invalidate({ id: supplier?.id });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/supplier");
      }
    },
    onError: (error) => {
      console.error("Update data supplier error:", error);
      toast.error(error.message || "Gagal memperbarui data supplier");
    },
  });

  // Handle province change - reset regencycode
  const handleProvinceChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`addresses.${index}.provinceCode`, value);
      form.setValue(`addresses.${index}.regencyCode`, "");
      form.setValue(`addresses.${index}.districtCode`, "");
    },
    [form]
  );

  // Handle regency change - reset district code
  const handleRegencyChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`addresses.${index}.regencyCode`, value);
      form.setValue(`addresses.${index}.districtCode`, "");
    },
    [form]
  );

  // Handle country change - reset city code
  const handleCountryChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`addresses.${index}.countryCode`, value);

      // Jika country ID
      if (value !== "ID") {
        form.setValue(`addresses.${index}.provinceCode`, "");
        form.setValue(`addresses.${index}.regencyCode`, "");
        form.setValue(`addresses.${index}.districtCode`, "");
      }
    },
    [form]
  );

  // Helper function to clean form data
  const cleanFormData = useCallback((data: SupplierTypeSchema) => {
    // Helper untuk convert empty string ke undefined
    const emptyToUndefined = (value: string | undefined) => {
      return value && value.trim() !== "" ? value : undefined;
    };

    return {
      name: data.name,
      supplierType: data.supplierType,
      statusActive: data.statusActive,
      activeDate: data.activeDate,
      notes: emptyToUndefined(data.notes),
      npwpNumber: emptyToUndefined(data.npwpNumber),
      npwpName: emptyToUndefined(data.npwpName),
      npwpAddress: emptyToUndefined(data.npwpAddress),
      npwpDate: emptyToUndefined(data.npwpDate),
      addresses: data.addresses?.map((address) => ({
        ...(address.id && { id: address.id }), // Only include id if exists
        addressType: address.addressType,
        addressLine1: address.addressLine1,
        addressLine2: emptyToUndefined(address.addressLine2),
        zipcode: emptyToUndefined(address.zipcode),
        isPrimaryAddress: address.isPrimaryAddress,
        countryCode: address.countryCode,
        // Location fields - undefined untuk International
        provinceCode:
          address.countryCode !== "ID"
            ? undefined
            : emptyToUndefined(address.provinceCode),
        regencyCode:
          address.countryCode !== "ID"
            ? undefined
            : emptyToUndefined(address.regencyCode),
        districtCode:
          address.countryCode !== "ID"
            ? undefined
            : emptyToUndefined(address.districtCode),
      })),
      contacts: data.contacts?.map((contact) => ({
        ...(contact.id && { id: contact.id }), // Only include id if exists
        contactType: contact.contactType,
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        email: emptyToUndefined(contact.email),
        isPrimaryContact: contact.isPrimaryContact,
        ...(contact.supplierId && { supplierId: contact.supplierId }), // Only include supplierID if exists
      })),
    };
  }, []);

  // Submit handler
  const onSubmitSupplier = async (data: SupplierTypeSchema) => {
    setIsLoading(true);
    try {
      const cleanedData = cleanFormData(data);

      if (mode === "create") {
        await createMutation.mutateAsync(cleanedData);
      } else {
        await updateMutation.mutateAsync({
          ...cleanedData,
          id: supplier?.id,
        } as SupplierUpdateTypeSchema);
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
        form.setValue(`addresses.${i}.isPrimaryAddress`, i === index);
      });
    },
    [addressFields, form]
  );

  const handlePrimaryContact = useCallback(
    (index: number) => {
      contactFields.forEach((_, i) => {
        form.setValue(`contacts.${i}.isPrimaryContact`, i === index);
      });
    },
    [contactFields, form]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard/supplier");
    }
  }, [onCancel, router]);

  // Handle add actions
  const handleAddAddress = useCallback(() => {
    appendAddress({ ...defaultAddress, isPrimaryAddress: false });
  }, [appendAddress]);

  const handleAddContact = useCallback(() => {
    appendContact({ ...defaultContact, isPrimaryContact: false });
  }, [appendContact]);

  // Handle remove address with primary address validation
  const handleRemoveAddress = useCallback(
    (index: number) => {
      const currentAddresses = form.getValues("addresses");
      if (!currentAddresses || currentAddresses.length <= 1) return;

      const addressToRemove = currentAddresses[index];
      removeAddress(index);

      // If remove primary address, set first remaining address as primary
      if (addressToRemove?.isPrimaryAddress) {
        const newPrimaryIndex = index === 0 ? 0 : 0;
        setTimeout(() => {
          form.setValue(`addresses.${newPrimaryIndex}.isPrimaryAddress`, true);
        }, 0);
      }
    },
    [form, removeAddress]
  );

  // Handle remove contact with primary contact validation
  const handleRemoveContact = useCallback(
    (index: number) => {
      const currentContacts = form.getValues("contacts");
      if (!currentContacts || currentContacts.length <= 1) return;

      const contactToRemove = currentContacts[index];
      removeContact(index);

      // If removing primary contact, set first remaining contact as primary
      if (contactToRemove?.isPrimaryContact) {
        const newPrimaryIndex = index === 0 ? 0 : 0;
        setTimeout(() => {
          form.setValue(`contacts.${newPrimaryIndex}.isPrimaryContact`, true);
        }, 0);
      }
    },
    [form, removeContact]
  );

  if (mode === "edit" && (isLoadingSupplier || isPendingSupplier)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitSupplier)}
        className="space-y-6"
      >
        {/* Supplier Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Supplier
            </CardTitle>
            <CardDescription>Masukkan informasi dasar Supplier</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nama Supplier <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama Supplier" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipe Supplier <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe Supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LOGISTIC">
                          <div className="flex items-center">
                            <Warehouse className="mr-2 h-4 w-4" />
                            Logistic
                          </div>
                        </SelectItem>
                        <SelectItem value="SERVICES">
                          <div className="flex items-center">
                            <HandCoins className="mr-2 h-4 w-4" />
                            Services
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan catatan..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

              <FormField
                control={form.control}
                name="activeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Terdaftar</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        placeholder="Tanggal terdaftar..."
                        className="resize-none"
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
                  Tambahkan alamat supplier (minimal 1 alamat)
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
                      name={`addresses.${index}.isPrimaryAddress`}
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
                      name={`addresses.${index}.addressType`}
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
                      name={`addresses.${index}.countryCode`}
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
                    name={`addresses.${index}.addressLine1`}
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
                    name={`addresses.${index}.addressLine2`}
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
                        name={`addresses.${index}.provinceCode`}
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
                        name={`addresses.${index}.regencyCode`}
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
                        name={`addresses.${index}.districtCode`}
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

                  {/* Show message for Supplier non ID */}
                  {watchedAddresses?.[index]?.countryCode !== "ID" && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Catatan:</strong> Untuk Supplier Luar Indonesia
                        (ID), cukup isi alamat lengkap di field &rdquo;Alamat
                        Baris 1&rdquo; dan &rdquo;Alamat Baris 2&rdquo;.
                      </p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name={`addresses.${index}.zipcode`}
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
                  Tambahkan kontak supplier (minimal 1 kontak)
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
                    name={`contacts.${index}.isPrimaryContact`}
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
                    name={`contacts.${index}.contactType`}
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
                    name={`contacts.${index}.name`}
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
                    name={`contacts.${index}.phoneNumber`}
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
                    name={`contacts.${index}.email`}
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
                {mode === "create" ? "Simpan Supplier" : "Update Supplier"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
