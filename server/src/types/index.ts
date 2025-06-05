import { UserRoles } from "../generated/prisma";

export interface SecretUser {
  id: string;
  email: string;
  username: string;
  role: UserRoles;
}