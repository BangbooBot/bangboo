import type { AuthenticatedUser } from "bangboo-shared/dtos";
import type { Request } from "express";

export type { AuthenticatedUser };

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
