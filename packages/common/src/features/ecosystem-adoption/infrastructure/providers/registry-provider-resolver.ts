import type { RegistrySource } from "../../domain/models/adoption.js";
import type { RegistryProviderResolverPort } from "../../application/ports/registry-provider-resolver-port.js";
import type { RegistryProviderPort } from "../../application/ports/registry-provider-port.js";

export class RegistryProviderResolver implements RegistryProviderResolverPort {
  private readonly providerBySource: ReadonlyMap<
    RegistrySource,
    RegistryProviderPort
  >;

  constructor(
    providers: readonly RegistryProviderPort[],
    enabledSources: readonly RegistrySource[],
  ) {
    const enabled = new Set<RegistrySource>(enabledSources);
    this.providerBySource = new Map(
      providers
        .filter((provider) => enabled.has(provider.source))
        .map((provider) => [provider.source, provider] as const),
    );
  }

  resolve(source: RegistrySource): RegistryProviderPort | null {
    return this.providerBySource.get(source) ?? null;
  }
}
