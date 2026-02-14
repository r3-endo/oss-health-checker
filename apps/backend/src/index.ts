import { buildApp, buildContainer } from "./app.js";
import { env } from "@oss-health-checker/common/shared/config/env.js";

const container = buildContainer(env);
export const app = buildApp(container);

export default app;
