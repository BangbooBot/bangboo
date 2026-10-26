import { db } from "../client.js";
import { createUserRepository } from "./user.repository.js";

export * from "./user.repository.js";

export const userRepository = createUserRepository(db);
