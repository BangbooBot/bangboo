import { Role } from "bangboo-shared";

export interface AuthenticatedUser {
  id: string;
  role: Role;
  discordId: string | null;
  sessionId: string;
}