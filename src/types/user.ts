import { Role } from "@prisma/client";

export interface IUser {
  id: string;
  username: string;
  fullname: string;
  role: Role;
  email: string | undefined;
  profilPic?: string | null;
}
