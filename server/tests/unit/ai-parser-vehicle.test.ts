import { extractVehicleFromText } from '../../src/services/ai-parser-vehicle';
import { parseWithRegex } from '../../src/services/ai-parser.service';

describe('extractVehicleFromText', () => {
  it('extracts Suzuki Samurai from typical listing text', () => {
    const result = extractVehicleFromText(
      'Lampa tylna Suzuki Samurai 1990 prawa, używana, oryginał',
    );
    expect(result.vehicleMake).toBe('Suzuki');
    expect(result.vehicleModel).toBe('Samurai');
  });

  it('extracts BMW model code', () => {
    const result = extractVehicleFromText('Amortyzator przedni lewy BMW E46 2002');
    expect(result.vehicleMake).toBe('BMW');
    expect(result.vehicleModel).toBe('E46');
  });
});

describe('parseWithRegex', () => {
  it('fills vehicle and condition fields', () => {
    const result = parseWithRegex('Lampa tylna Suzuki Samurai 1990 prawa, używana');
    expect(result.vehicleMake).toBe('Suzuki');
    expect(result.vehicleModel).toBe('Samurai');
    expect(result.vehicleYear).toBe(1990);
    expect(result.partSide).toBe('Prawa');
    expect(result.condition).toBe('USED');
  });
});
