"use client";

import { trpc } from "@/app/_trpcClient/client";
import { Suspense } from "react";

export const ViewUsers = () => {
  const { data: users } = trpc.users.getUsers.useQuery();
  return (
    <div>
      <Suspense fallback={<div>Loading data user ....</div>}>
        {users?.map((user, index) => (
          <div key={user.id} className="grid grid-cols-3 max-w-lg">
            <p>{index + 1}</p>
            <p>{user.fullname}</p>
            <p>{user.email}</p>
          </div>
        ))}
      </Suspense>
    </div>
  );
};
