import type {
  RefreshRepositoryAdoptionInput,
  RefreshRepositoryAdoptionUseCase,
} from "@oss-health-checker/common/features/ecosystem-adoption/application/use-cases/refresh-repository-adoption-use-case.js";

export class AdoptionController {
  constructor(
    private readonly refreshRepositoryAdoptionUseCase: RefreshRepositoryAdoptionUseCase,
  ) {}

  refresh = async (
    input: RefreshRepositoryAdoptionInput,
  ): Promise<{
    data: {
      adoption: Awaited<
        ReturnType<RefreshRepositoryAdoptionUseCase["execute"]>
      >;
    };
  }> => {
    const adoption = await this.refreshRepositoryAdoptionUseCase.execute(input);
    return { data: { adoption } };
  };
}
