import { getVehicleMakes, getVehicleModels } from '@/api/categories.api';
import { ParsedListingData } from '@/api/ai-parser.api';
import { VehicleMake, VehicleType } from '@/types';

export interface ResolvedVehiclePatch {
  vehicleMakeId?: string;
  vehicleModelId?: string;
  vehicleYearRaw?: number;
  vehicleType?: VehicleType;
}

function normalize(value: string): string {
  return value.toLowerCase().trim();
}

function fuzzyMatch(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);
  return left === right || left.includes(right) || right.includes(left);
}

function pickVehicleType(make: VehicleMake, preferred: VehicleType): VehicleType {
  if (make.types.includes(preferred)) return preferred;
  return make.types[0] ?? preferred;
}

async function findMakeAndModel(
  makeName: string,
  modelName: string | null,
  preferredType: VehicleType,
): Promise<ResolvedVehiclePatch | null> {
  const makes = await getVehicleMakes();
  const make = makes.find((item) => fuzzyMatch(item.name, makeName));
  if (!make) return null;

  const vehicleType = pickVehicleType(make, preferredType);
  const patch: ResolvedVehiclePatch = { vehicleMakeId: make.id, vehicleType };

  if (!modelName) return patch;

  const models = await getVehicleModels(make.id);
  const model = models.find((item) => fuzzyMatch(item.name, modelName));
  if (model) patch.vehicleModelId = model.id;

  return patch;
}

export async function resolveVehicleFromParsed(
  parsed: ParsedListingData,
  preferredType: VehicleType,
): Promise<ResolvedVehiclePatch> {
  const yearPatch = parsed.vehicleYear ? { vehicleYearRaw: parsed.vehicleYear } : {};

  const makeName = parsed.vehicleMake?.trim();
  const modelName = parsed.vehicleModel?.trim() ?? null;

  if (!makeName) return yearPatch;

  const resolved = await findMakeAndModel(makeName, modelName, preferredType);
  if (resolved) return { ...resolved, ...yearPatch };

  return yearPatch;
}
