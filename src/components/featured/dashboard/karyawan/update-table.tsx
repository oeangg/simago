"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { trpc } from "@/app/_trpcClient/client";
// import { Gender } from "@prisma/client";
import { actionColumn, baseColumns, IEmployeeColumnProps } from "./columns";
import { Gender } from "@prisma/client";
import { toast } from "sonner";

const generateSkeletonData = (count: number): IEmployeeColumnProps[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `skeleton-${index}`,
    isActive: false,
    nik: "nik123",
    name: "nama",
    gender: Gender.MALE,
    phoneNumber: "0812",
  }));
};

export const UpdateDataTable = () => {
  const [data, setData] = useState<IEmployeeColumnProps[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const {
    data: dataEmployees,
    isLoading: isLoadingKaryawan,
    refetch: refetchDataKaryawan,
  } = trpc.Employee.getAllEmployee.useQuery();

  const deleteEmployee = trpc.Employee.deleteEmployee.useMutation({
    onMutate: (data) => {
      setDeletingId(data.id);
    },

    onSuccess: (data) => {
      toast.success(data.message);
      refetchDataKaryawan();
    },

    onError: (error) => {
      toast.error(error.message);
    },

    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDeleteEmployee = (id: string) => {
    deleteEmployee.mutate({ id });
  };

  useEffect(() => {
    if (dataEmployees) {
      const Employees: IEmployeeColumnProps[] = dataEmployees.map(
        (employee) => ({
          id: employee.id,
          isActive: employee.isActive,
          nik: employee.nik,
          name: employee.name,
          gender: employee.gender,
          phoneNumber: employee.phoneNumber,
        })
      );
      setData(Employees);
    }
  }, [dataEmployees]);

  const displayData = isLoadingKaryawan ? generateSkeletonData(4) : data;
  const columns = [...baseColumns, actionColumn];

  return (
    <DataTable
      columns={columns}
      data={displayData}
      deletingId={deletingId}
      onDeleteEmployee={handleDeleteEmployee}
    />
  );
};
