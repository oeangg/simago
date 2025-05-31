"use client";

import { trpc } from "@/app/_trpc/client";
import { Button } from "./ui/button";

export const ViewUsers = () => {
  const { data: users } = trpc.users.getUsers.useQuery();
  return (
    <div>
      {users?.map((user) => (
        <div key={user.id}>
          <p>{user.fullname}</p>
          <p>{user.email}</p>
        </div>
      ))}
      <Button variant="default">Hallo</Button>
    </div>
  );
};
