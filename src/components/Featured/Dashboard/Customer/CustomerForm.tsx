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
  User,
  MapPin,
  Phone,
  FileText,
  Mail,
  CalendarIcon,
} from "lucide-react";
import { AddressType, ContactType, StatusActive } from "@prisma/client";
import { id } from "date-fns/locale";
import { format } from "date-fns";

interface CustomerFormProps {
  customer?: {
    id: string;
    code: string;
    name: string;
    statusActive: StatusActive;
    activeDate: string | null;
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

const MAX_ADDRESSES = 10;

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
  // const { data: countries = [] } = trpc.Customer.getCountries.useQuery();
  const { data: countries = [] } = trpc.City.getCountries.useQuery();

  // Fetch provinces
  // const { data: provinces = [] } = trpc.Customer.getProvinces.useQuery();
  const { data: provinces = [] } = trpc.City.getProvinces.useQuery();

  // Initialize form default values
  const getDefaultValues = useCallback(() => {
    if (mode === "edit" && customerData) {
      return {
        id: customerData.id,
        code: customerData.code,
        name: customerData.name,
        statusActive: customerData.statusActive,
        activeDate: customerData.activeDate
          ? new Date(customerData.activeDate).toISOString().slice(0, 10)
          : new Date(customerData.activeDate).toISOString().slice(0, 10),
        notes: customerData.notes || "",
        npwpNumber: customerData.npwpNumber || "",
        npwpName: customerData.npwpName || "",
        npwpAddress: customerData.npwpAddress || "",
        npwpDate: customerData.npwpDate
          ? new Date(customerData.npwpDate).toISOString().slice(0, 10)
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
      statusActive: "ACTIVE" as StatusActive,
      activeDate: new Date().toISOString().split("T")[0],
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
      form.reset(getDefaultValues());
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
  const watchedAddresses = form.watch("addresses");

  // Dynamic regency queries based on province selection
  const utils = trpc.useUtils();

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
          address.countryCode === "ID"
            ? emptyToUndefined(address.provinceCode)
            : undefined,
        regencyCode:
          address.countryCode === "ID"
            ? emptyToUndefined(address.regencyCode)
            : undefined,
        districtCode:
          address.countryCode === "ID"
            ? emptyToUndefined(address.districtCode)
            : undefined,
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
                      <Input
                        placeholder="Ex: CUST-001"
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
                      Nama Customer <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama Customer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2 border p-4 rounded-lg">
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
                          <Badge variant="secondary" className="bg-yellow-500">
                            Ditangguhkan
                          </Badge>
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
                    <FormLabel>Tanggal Aktif</FormLabel>
                    <FormControl>
                      <div className="flex items-center px-3 py-2 border border-input bg-background rounded-md">
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
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
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan Catatan tambahan..."
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
                      <Input
                        placeholder="Masukan Nomor sesuai NPWP"
                        {...field}
                      />
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
                        placeholder="Masukkan Nama sesuai NPWP"
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
                        placeholder="Masukkan Alamat sesuai NPWP"
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
                          <Input
                            placeholder="Masukkan Nama kontak"
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
                          <Input placeholder="Masukkan No telpon" {...field} />
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
                {mode === "create" ? "Simpan Customer" : "Update Customer"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
