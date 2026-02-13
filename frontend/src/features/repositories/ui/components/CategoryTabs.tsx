import type { CategorySummary } from "../../model/types";

export const CategoryTabs = ({
  categories,
  selectedSlug,
  onSelect,
}: {
  categories: readonly CategorySummary[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}) => (
  <nav aria-label="Repository categories" className="mb-6 flex flex-wrap gap-2">
    {categories.map((category) => {
      const isSelected = category.slug === selectedSlug;

      return (
        <button
          key={category.slug}
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(category.slug)}
          className={`inline-flex items-center rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            isSelected
              ? "border-accent bg-accent/10 text-text-primary"
              : "border-border-subtle text-text-secondary hover:border-text-tertiary hover:text-text-primary"
          }`}
        >
          {category.name}
        </button>
      );
    })}
  </nav>
);
