import { getAiStatus, resolveAiMode } from '../../src/services/ai.client';

describe('ai.client', () => {
  it('reports AI status', () => {
    const status = getAiStatus();
    expect(status).toHaveProperty('configured');
    expect(status).toHaveProperty('mode');
    expect(['AI', 'MOCK', 'OFF']).toContain(status.mode);
    expect(status.features).toContain('import-seo');
  });

  it('resolves mode consistently with status', () => {
    expect(resolveAiMode()).toBe(getAiStatus().mode);
  });
});
