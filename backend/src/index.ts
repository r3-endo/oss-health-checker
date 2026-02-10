import { buildApp, buildContainer } from "./app";
import { env } from "./infrastructure/config/env";

const container = buildContainer(env);
export const app = buildApp(container);

export default app;
