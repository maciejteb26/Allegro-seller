import { InternalCategory } from '@/types';

const AUTOMOTIVE_PARENT_SLUGS = new Set([
  'engine', 'gearbox', 'drivetrain', 'suspension', 'brakes', 'lighting',
  'bodywork', 'interior', 'electronics', 'cooling', 'air-conditioning',
  'exhaust', 'fuel-system', 'filters-fluids', 'steering', 'other',
]);

export function resolveCategoryParentSlug(
  categoryId: string | undefined,
  categoryTree: InternalCategory[],
): string | null {
  if (!categoryId) return null;
  const parent = categoryTree.find((item) => item.children?.some((child) => child.id === categoryId));
  if (parent) return parent.slug;
  const self = categoryTree.find((item) => item.id === categoryId);
  return self?.slug ?? null;
}

export function isAutomotiveCategory(
  categoryId: string | undefined,
  categoryTree: InternalCategory[],
): boolean {
  const parentSlug = resolveCategoryParentSlug(categoryId, categoryTree);
  return parentSlug ? AUTOMOTIVE_PARENT_SLUGS.has(parentSlug) : false;
}
