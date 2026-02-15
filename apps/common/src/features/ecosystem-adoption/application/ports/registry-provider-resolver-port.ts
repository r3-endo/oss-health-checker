import type { RegistrySource } from "../../domain/models/adoption.js";
import type { RegistryProviderPort } from "./registry-provider-port.js";

export interface RegistryProviderResolverPort {
  resolve(source: RegistrySource): RegistryProviderPort | null;
}
