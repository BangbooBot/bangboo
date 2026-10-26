import { Global, Inject, Module, type OnApplicationShutdown } from "@nestjs/common";
import { closeDb, userRepository, type UserRepository } from "bangboo-shared/db";

export const USER_REPOSITORY = Symbol("USER_REPOSITORY");

@Global()
@Module({
  providers: [{ provide: USER_REPOSITORY, useValue: userRepository satisfies UserRepository }],
  exports: [USER_REPOSITORY],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown(): Promise<void> {
    await closeDb();
  }
}

export const InjectUserRepository = () => Inject(USER_REPOSITORY);
