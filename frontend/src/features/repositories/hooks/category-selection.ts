import type { CategorySummary } from "../model/types";

export const sortCategoriesByDisplayOrder = (
  categories: readonly CategorySummary[],
): readonly CategorySummary[] =>
  [...categories].sort((left, right) => left.displayOrder - right.displayOrder);

export const resolveSelectedCategorySlug = (
  selectedSlug: string | null,
  categories: readonly CategorySummary[],
): string | null => {
  if (categories.length === 0) {
    return null;
  }

  if (
    selectedSlug &&
    categories.some((category) => category.slug === selectedSlug)
  ) {
    return selectedSlug;
  }

  return categories[0]?.slug ?? null;
};
