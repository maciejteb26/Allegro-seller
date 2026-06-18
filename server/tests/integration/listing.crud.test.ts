import request from 'supertest';
import { app } from '../../src/app';
import { resetDb } from './helpers/db';
import { uniqueEmail, cookieHeader, createCategoryWithAllegroMapping } from './helpers/fixtures';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
});

async function registerAndGetCookie(email: string) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'password123', name: 'Listing Tester' });
  return cookieHeader(res);
}

function listingPayload(categoryId: string, overrides: Record<string, unknown> = {}) {
  return {
    title: 'Alternator Bosch do Golfa',
    description: 'Sprawny alternator, sprawdzony na stanowisku testowym.',
    basePrice: 199.99,
    condition: 'USED',
    identMethod: 'MANUAL',
    vehicleType: 'CAR',
    categoryId,
    ...overrides,
  };
}

describe('listing CRUD + autoryzacja', () => {
  it('creates a listing and sanitizes the description', async () => {
    const category = await createCategoryWithAllegroMapping();
    const cookie = await registerAndGetCookie(uniqueEmail('listing-create'));

    const res = await request(app)
      .post('/api/listings')
      .set('Cookie', cookie)
      .send(
        listingPayload(category.id, {
          description: 'Opis z <script>alert(1)</script> w treści, dobry stan ogólny.',
        }),
      );

    expect(res.status).toBe(201);
    expect(res.body.description).not.toContain('<script>');
    expect(res.body.description).not.toContain('alert(1)');
  });

  it('does not let user B read, update or delete a listing created by user A', async () => {
    const category = await createCategoryWithAllegroMapping();
    const cookieA = await registerAndGetCookie(uniqueEmail('listing-a'));
    const cookieB = await registerAndGetCookie(uniqueEmail('listing-b'));

    const createRes = await request(app)
      .post('/api/listings')
      .set('Cookie', cookieA)
      .send(listingPayload(category.id));
    expect(createRes.status).toBe(201);
    const listingId = createRes.body.id;

    const getAsB = await request(app).get(`/api/listings/${listingId}`).set('Cookie', cookieB);
    expect(getAsB.status).toBe(404);

    const updateAsB = await request(app)
      .put(`/api/listings/${listingId}`)
      .set('Cookie', cookieB)
      .send({ title: 'Próba podmiany' });
    expect(updateAsB.status).toBe(404);

    const deleteAsB = await request(app).delete(`/api/listings/${listingId}`).set('Cookie', cookieB);
    expect(deleteAsB.status).toBe(404);

    const getAsA = await request(app).get(`/api/listings/${listingId}`).set('Cookie', cookieA);
    expect(getAsA.status).toBe(200);
  });
});
