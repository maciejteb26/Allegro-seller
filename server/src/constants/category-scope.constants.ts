export const AUTOMOTIVE_CATEGORY_PARENT_SLUGS = [
  'engine',
  'gearbox',
  'drivetrain',
  'suspension',
  'brakes',
  'lighting',
  'bodywork',
  'interior',
  'electronics',
  'cooling',
  'air-conditioning',
  'exhaust',
  'fuel-system',
  'filters-fluids',
  'steering',
  'other',
] as const;

export type AutomotiveCategoryParentSlug = (typeof AUTOMOTIVE_CATEGORY_PARENT_SLUGS)[number];

export function isAutomotiveCategorySlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  return (AUTOMOTIVE_CATEGORY_PARENT_SLUGS as readonly string[]).includes(slug);
}
