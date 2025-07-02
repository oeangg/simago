"use client";

import { useEffect, useState } from "react";
import {
  ManUserRoleColumn,
  ManUserStatusColumn,
  manUserbaseColumn,
} from "./Columns";
import { DataTableManUser } from "./DataTable";
import { IUserProps } from "./Columns";
import { toast } from "sonner";
import { trpc } from "@/app/_trpcClient/client";
import { Role } from "@prisma/client";

export const IndexPageManUserDataTable = () => {
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
        createdAt: new Date(user.createdAt),
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
    ...manUserbaseColumn,
    ManUserRoleColumn({ onUpdateRole: handleUpdateRole, editingRoleId }),
    ManUserStatusColumn({
      onToggleStatus: handleToggleStatus,
      editingStatusId,
    }),
  ];

  return (
    <DataTableManUser
      columns={columns}
      data={data}
      isLoading={isLoadingUsers}
    />
  );
};
