import z from "zod";
import { Role } from "bangboo-shared";

export const roleSchema = z.enum(Role);