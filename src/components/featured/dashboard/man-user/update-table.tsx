"use client";

import { useEffect, useState } from "react";
import { baseColumn, roleColumn, statusColumn } from "./columns";
import { DataTable } from "./data-table";
import { IUserProps } from "./columns";
import { toast } from "sonner";
import { trpc } from "@/app/_trpcClient/client";
import { Role } from "@prisma/client";

const generateSkeletonData = (count: number): IUserProps[] => {
  return Array.from({ length: count }).map((_, index) => ({
    id: `skeleton-${index}`,
    fullname: "nama...",
    username: "username...",
    email: "user@email.com..",
    profilPic: null, //
    role: Role.USER, //
    createAt: new Date(),
    isActive: false, //
  }));
};

export const UpdateDataTable = () => {
  const [data, setData] = useState<IUserProps[]>([]);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  const {
    data: DataUsers,
    refetch: RefrethDataUsers,
    isLoading: isLoadingUsers,
  } = trpc.User.getUsers.useQuery();

  useEffect(() => {
    if (DataUsers) {
      const Users: IUserProps[] = DataUsers.map((user) => ({
        id: user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        profilPic: user.profilPic,
        role: user.role as Role,
        createAt: new Date(user.createAt),
        isActive: user.isActive,
      }));
      setData(Users);
    }
  }, [DataUsers]);

  const { mutate: UpdateStatusActive } =
    trpc.User.updateStatusActiveUser.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        RefrethDataUsers();
      },

      onError: (error) => {
        toast.error(error.message);
        RefrethDataUsers();
      },
      onSettled: () => {
        setEditingStatusId(null);
      },
    });

  const { mutate: UpdateRoleUser } = trpc.User.updateRoleUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      RefrethDataUsers();
    },

    onError: (error) => {
      toast.error(error.message);
      RefrethDataUsers();
    },
    onSettled: () => {
      setEditingRoleId(null);
    },
  });

  const handleToggleStatus = async (id: string, newStatus: boolean) => {
    setData((prev) =>
      prev.map((user) =>
        user.id === id ? { ...user, status: newStatus } : user
      )
    );
    setEditingStatusId(id);

    UpdateStatusActive({ userId: id, status: newStatus });
  };

  const handleUpdateRole = async (id: string, newRole: Role) => {
    setData((prev) =>
      prev.map((user) => (user.id === id ? { ...user, role: newRole } : user))
    );
    setEditingRoleId(id);

    UpdateRoleUser({ userId: id, role: newRole });
  };

  const columns = [
    ...baseColumn,
    roleColumn({ onUpdateRole: handleUpdateRole, editingRoleId }),
    statusColumn({ onToggleStatus: handleToggleStatus, editingStatusId }),
  ];

  const displayData = isLoadingUsers ? generateSkeletonData(4) : data;

  return <DataTable columns={columns} data={displayData} />;
};
