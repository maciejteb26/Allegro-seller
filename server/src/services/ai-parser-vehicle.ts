import { PARSER_MODELS_BY_MAKE, PARSER_VEHICLE_MAKES } from '../constants/vehicle-parser-hints';

export interface ExtractedVehicle {
  vehicleMake: string | null;
  vehicleModel: string | null;
}

export function extractVehicleFromText(rawInput: string): ExtractedVehicle {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  for (const make of PARSER_VEHICLE_MAKES) {
    const makeLower = make.toLowerCase();
    const index = lower.indexOf(makeLower);
    if (index === -1) continue;

    const knownModels = PARSER_MODELS_BY_MAKE[make] ?? [];
    const afterMake = text.slice(index + make.length);

    for (const model of knownModels) {
      const modelPattern = new RegExp(`\\b${escapeRegex(model)}\\b`, 'i');
      if (modelPattern.test(afterMake) || modelPattern.test(text)) {
        return { vehicleMake: make, vehicleModel: model };
      }
    }

    const genericModel = afterMake.match(
      /^\s+([A-Za-z0-9][A-Za-z0-9-]{1,24}?)(?=\s+\d{4}|\s*,|\s+(prawa|lewy|lewa|prawy|używ|uzyw|nowa|nowy|uszk)|$)/i,
    );
    if (genericModel?.[1]) {
      return { vehicleMake: make, vehicleModel: genericModel[1].trim() };
    }

    return { vehicleMake: make, vehicleModel: null };
  }

  return { vehicleMake: null, vehicleModel: null };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
