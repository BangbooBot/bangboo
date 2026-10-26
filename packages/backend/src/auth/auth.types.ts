import type { AuthenticatedUser } from "./dto/authenticated-user.dto.js";
import type { Request } from "express";

export type { AuthenticatedUser };

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
