"use client";

import { trpc } from "@/app/_trpc/client";

export const ViewUsers = () => {
  const { data: users } = trpc.users.getUsers.useQuery();
  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>
          <p>{user.fullname}</p>
          <p>{user.email}</p>
          <p>{user.userName}</p>
        </div>
      ))}
    </div>
  );
};
