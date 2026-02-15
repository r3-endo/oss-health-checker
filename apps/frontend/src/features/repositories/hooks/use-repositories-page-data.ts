import { useEffect, useMemo, useState } from "react";
import { useCategoriesQuery } from "./use-categories-query";
import { useCategoryDetailQuery } from "./use-category-detail-query";
import {
  resolveSelectedCategorySlug,
  sortCategoriesByDisplayOrder,
} from "./category-selection";

export const useRepositoriesPageData = () => {
  const categoriesQuery = useCategoriesQuery();
  const categories = useMemo(
    () => sortCategoriesByDisplayOrder(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSlug((current) =>
      resolveSelectedCategorySlug(current, categories),
    );
  }, [categories]);

  const detailQuery = useCategoryDetailQuery(selectedSlug);

  return {
    categories,
    selectedSlug,
    setSelectedSlug,
    categoriesQuery,
    detailQuery,
  };
};
