import { sanitizeDescription } from '../../src/controllers/listing.controller';

describe('sanitizeDescription', () => {
  it('strips script tags', () => {
    const input = 'Opis części <script>alert(1)</script> w dobrym stanie';
    const result = sanitizeDescription(input);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert(1)');
  });

  it('strips inline event handler attributes', () => {
    const input = '<p onclick="alert(1)">Opis</p>';
    const result = sanitizeDescription(input);
    expect(result).not.toContain('onclick');
  });

  it('strips disallowed tags like iframe', () => {
    const input = '<iframe src="javascript:alert(1)"></iframe>Opis części';
    const result = sanitizeDescription(input);
    expect(result).not.toContain('<iframe');
  });

  it('keeps allowed formatting tags', () => {
    const input = '<p>Opis <strong>części</strong> samochodowej</p>';
    const result = sanitizeDescription(input);
    expect(result).toContain('<strong>');
    expect(result).toContain('<p>');
  });
});
