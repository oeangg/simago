"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/app/_trpcClient/client";
import {
  customerSchema,
  CustomerTypeSchema,
  customerUpdateSchema,
  CustomerUpdateTypeSchema,
} from "@/schemas/customerSchema";
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
  X,
  Building2,
  User,
  MapPin,
  Phone,
  FileText,
  Home,
  Mail,
} from "lucide-react";
import {
  AddressType,
  ContactType,
  CustomerType,
  StatusActive,
} from "@prisma/client";

interface CustomerFormProps {
  customer?: {
    id: string;
    code: string;
    name: string;
    customerType: CustomerType;
    statusActive: StatusActive;
    notes?: string | null;
    npwpNumber?: string | null;
    npwpName?: string | null;
    npwpAddress?: string | null;
    npwpDate?: string | null;
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
      customerId: string;
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

export function CustomerForm({
  customer,
  mode,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Fetch customer data if in edit mode
  const {
    data: customerData,
    isLoading: isLoadingCustomer,
    isPending: isPendingCustomer,
  } = trpc.Customer.getCustomer.useQuery(
    { id: customer?.id || "" },
    { enabled: mode === "edit" && !!customer?.id }
  );

  // Fetch countries
  const { data: countries = [] } = trpc.Customer.getCountries.useQuery();

  // Fetch provinces
  const { data: provinces = [] } = trpc.Customer.getProvinces.useQuery();

  // Initialize form default values
  const getDefaultValues = useCallback(() => {
    if (mode === "edit" && customerData) {
      return {
        id: customerData.id,
        code: customerData.code,
        name: customerData.name,
        customerType: customerData.customerType,
        statusActive: customerData.statusActive,
        notes: customerData.notes || "",
        npwpNumber: customerData.npwpNumber || "",
        npwpName: customerData.npwpName || "",
        npwpAddress: customerData.npwpAddress || "",
        npwpDate: customerData.npwpDate
          ? customerData.npwpDate.slice(0, 10)
          : "",
        addresses: customerData.addresses.map((addr) => ({
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
        contacts: customerData.contacts.map((ctc) => ({
          id: ctc.id,
          contactType: ctc.contactType,
          name: ctc.name,
          phoneNumber: ctc.phoneNumber,
          email: ctc.email || "",
          isPrimaryContact: ctc.isPrimaryContact,
          customerId: ctc.customerId,
        })),
      };
    }

    return {
      code: "",
      name: "",
      customerType: "DOMESTIC" as CustomerType,
      statusActive: "ACTIVE" as StatusActive,
      notes: "",
      npwpNumber: "",
      npwpName: "",
      npwpAddress: "",
      npwpDate: "",
      addresses: [{ ...defaultAddress }],
      contacts: [{ ...defaultContact }],
    };
  }, [customerData, mode]);

  // Initialize form - key: re-initialize when customerData changes
  const form = useForm<CustomerTypeSchema>({
    resolver: zodResolver(
      mode === "create" ? customerSchema : customerUpdateSchema
    ),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  // Re-initialize form when customerData changes (edit mode)
  useEffect(() => {
    if (mode === "edit" && customerData && !isPendingCustomer) {
      const newDefaultValues = getDefaultValues();
      form.reset(newDefaultValues);
    }
  }, [customerData, mode, isPendingCustomer, form, getDefaultValues]);

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

  // Watch customer type and address values for conditional rendering
  const customerType = form.watch("customerType");
  const watchedAddresses = form.watch("addresses");

  // Dynamic regency queries based on province selection
  const regencyQueries = (watchedAddresses || []).map((address) => {
    return trpc.Customer.getRegencies.useQuery(
      { provinceCode: address?.provinceCode || "" },
      {
        enabled: !!address?.provinceCode && address?.countryCode === "ID",
        staleTime: 5 * 60 * 1000, // 5 minutes cache
      }
    );
  });

  // Dynamic district queries based on regency selection
  const districtQueries = (watchedAddresses || []).map((address) => {
    return trpc.Customer.getDistricts.useQuery(
      { regencyCode: address?.regencyCode || "" },
      {
        enabled: !!address?.regencyCode && address?.countryCode === "ID",
        staleTime: 5 * 60 * 1000, // 5 minutes cache
      }
    );
  });

  // Helper functions to get query data
  const getRegencyQuery = useCallback(
    (index: number) => {
      return regencyQueries[index] || { data: [], isLoading: false };
    },
    [regencyQueries]
  );

  const getDistrictQuery = useCallback(
    (index: number) => {
      return districtQueries[index] || { data: [], isLoading: false };
    },
    [districtQueries]
  );

  // Mutations
  const utils = trpc.useUtils();

  const createMutation = trpc.Customer.createAllCustomer.useMutation({
    onSuccess: () => {
      toast.success("Customer berhasil dibuat");
      utils.Customer.getAllCustomers.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/customer");
      }
    },
    onError: (error) => {
      console.error("Create customer error:", error);
      toast.error(error.message || "Gagal membuat customer");
    },
  });

  const updateMutation = trpc.Customer.updateAllCustomer.useMutation({
    onSuccess: () => {
      toast.success("Customer berhasil diperbarui");
      utils.Customer.getAllCustomers.invalidate();
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/customer");
      }
    },
    onError: (error) => {
      console.error("Update customer error:", error);
      toast.error(error.message || "Gagal memperbarui customer");
    },
  });

  // Load customer data for edit mode - REMOVE COMPLEX LOGIC
  // useEffect sudah di-handle di atas dengan isPending check

  // Handle province change - reset dependent fields
  const handleProvinceChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`addresses.${index}.provinceCode`, value);
      form.setValue(`addresses.${index}.regencyCode`, "");
      form.setValue(`addresses.${index}.districtCode`, "");
    },
    [form]
  );

  // Handle regency change - reset dependent fields
  const handleRegencyChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`addresses.${index}.regencyCode`, value);
      form.setValue(`addresses.${index}.districtCode`, "");
    },
    [form]
  );

  // Handle country change - reset dependent fields
  const handleCountryChange = useCallback(
    (value: string, index: number) => {
      form.setValue(`addresses.${index}.countryCode`, value);
      if (value !== "ID") {
        form.setValue(`addresses.${index}.provinceCode`, "");
        form.setValue(`addresses.${index}.regencyCode`, "");
        form.setValue(`addresses.${index}.districtCode`, "");
      }
    },
    [form]
  );

  // Helper function to clean form data
  const cleanFormData = useCallback((data: CustomerTypeSchema) => {
    // Helper untuk convert empty string ke undefined
    const emptyToUndefined = (value: string | undefined) => {
      return value && value.trim() !== "" ? value : undefined;
    };

    return {
      code: data.code,
      name: data.name,
      customerType: data.customerType,
      statusActive: data.statusActive,
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
          data.customerType === "INTERNATIONAL"
            ? undefined
            : emptyToUndefined(address.provinceCode),
        regencyCode:
          data.customerType === "INTERNATIONAL"
            ? undefined
            : emptyToUndefined(address.regencyCode),
        districtCode:
          data.customerType === "INTERNATIONAL"
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
        ...(contact.customerId && { customerId: contact.customerId }), // Only include customerId if exists
      })),
    };
  }, []);

  // Submit handler
  const onSubmitCustomer = useCallback(
    async (data: CustomerTypeSchema) => {
      setIsLoading(true);
      try {
        const cleanedData = cleanFormData(data);
        console.log("Submitting data:", cleanedData);

        if (mode === "create") {
          await createMutation.mutateAsync(cleanedData);
        } else {
          await updateMutation.mutateAsync({
            ...cleanedData,
            id: customer?.id,
          } as CustomerUpdateTypeSchema);
        }
      } catch (error) {
        console.error("Submit error:", error);
        toast.error("Terjadi kesalahan saat menyimpan data");
      } finally {
        setIsLoading(false);
      }
    },
    [mode, createMutation, updateMutation, customer?.id, cleanFormData]
  );

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
      router.push("/dashboard/customer");
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

      // If removing primary address, set first remaining address as primary
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

  if (mode === "edit" && (isLoadingCustomer || isPendingCustomer)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmitCustomer)}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {mode === "create" ? "Tambah Customer" : "Edit Customer"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "create"
                ? "Buat customer baru dengan informasi lengkap"
                : "Perbarui informasi customer"}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Batal
          </Button>
        </div>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informasi Customer
            </CardTitle>
            <CardDescription>Masukkan informasi dasar customer</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Kode Customer <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="CUST-001" {...field} />
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
                      Nama Customer <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="PT. Example Indonesia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipe Customer <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DOMESTIC">
                          <div className="flex items-center">
                            <Home className="mr-2 h-4 w-4" />
                            Domestic
                          </div>
                        </SelectItem>
                        <SelectItem value="INTERNATIONAL">
                          <div className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            International
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mode === "edit" && (
                <FormField
                  control={form.control}
                  name="statusActive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
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
                            <Badge variant="secondary">No Active</Badge>
                          </SelectItem>
                          <SelectItem value="SUSPENDED">
                            <Badge variant="destructive">Suspended</Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Catatan tambahan..."
                      className="resize-none"
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
              Tambahkan informasi NPWP customer (opsional)
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
                      <Input placeholder="12.345.678.9-012.345" {...field} />
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
                      <Input placeholder="PT. Example Indonesia" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="npwpAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alamat NPWP</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Alamat sesuai NPWP..."
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
          </CardContent>
        </Card>

        {/* Addresses */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Alamat
                </CardTitle>
                <CardDescription>
                  Tambahkan alamat customer (minimal 1 alamat)
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
          <CardContent className="space-y-4">
            {addressFields.map((field, index) => (
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
                        <Input placeholder="Jl. Contoh No. 123" {...field} />
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
                        <Input placeholder="RT/RW, Kelurahan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show province, regency, district only for domestic (ID) */}
                {watchedAddresses?.[index]?.countryCode === "ID" &&
                  customerType === "DOMESTIC" && (
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
                        render={({ field }) => {
                          const regencyQuery = getRegencyQuery(index);
                          return (
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
                                disabled={!regencyQuery.data?.length}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih kabupaten/kota" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {regencyQuery.data?.map(
                                    (regency: Regency) => (
                                      <SelectItem
                                        key={regency.code}
                                        value={regency.code}
                                      >
                                        {regency.name}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />

                      <FormField
                        control={form.control}
                        name={`addresses.${index}.districtCode`}
                        render={({ field }) => {
                          const districtQuery = getDistrictQuery(index);
                          return (
                            <FormItem>
                              <FormLabel>
                                Kecamatan{" "}
                                <span className="text-red-500">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!districtQuery.data?.length}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih kecamatan" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {districtQuery.data?.map(
                                    (district: District) => (
                                      <SelectItem
                                        key={district.code}
                                        value={district.code}
                                      >
                                        {district.name}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  )}

                {/* Show message for International customers */}
                {customerType === "INTERNATIONAL" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Catatan:</strong> Untuk customer International,
                      cukup isi alamat lengkap di field &rdquo;Alamat Baris
                      1&rdquo; dan &rdquo;Alamat Baris 2&rdquo;.
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
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ))}
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
                  Tambahkan kontak customer (minimal 1 kontak)
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
                          <Input placeholder="John Doe" {...field} />
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
                          <Input placeholder="081234567890" {...field} />
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
                              placeholder="email@example.com"
                              className="pl-10"
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
                Lengkapi semua field wajib (*)
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
                {mode === "create" ? "Simpan Customer" : "Update Customer"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
