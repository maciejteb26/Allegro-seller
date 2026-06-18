import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/utils/prisma';
import { resetDb } from './helpers/db';
import { uniqueEmail, cookieHeader, createCategoryWithAllegroMapping } from './helpers/fixtures';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await resetDb();
});

describe('listing publish flow (mock mode)', () => {
  it('publishes a listing to Allegro and marks it ACTIVE', async () => {
    const category = await createCategoryWithAllegroMapping();

    const email = uniqueEmail('publish');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Publish Tester' });
    const cookie = cookieHeader(registerRes);

    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    const userId = meRes.body.id as string;

    const listing = await prisma.listing.create({
      data: {
        userId,
        title: 'Lampa przednia do Astry',
        description: 'Oryginalna lampa przednia, kompletna, bez uszkodzeń.',
        basePrice: 250,
        condition: 'USED',
        identMethod: 'MANUAL',
        vehicleType: 'CAR',
        categoryId: category.id,
      },
    });

    await prisma.listingImage.create({
      data: {
        listingId: listing.id,
        s3Key: 'test/fake-image.jpg',
        s3Bucket: 'test-bucket',
        order: 0,
        isMain: true,
      },
    });

    await prisma.userPlatform.create({
      data: { userId, platform: 'ALLEGRO', isActive: true },
    });

    const publishRes = await request(app)
      .post(`/api/listings/${listing.id}/publish`)
      .set('Cookie', cookie)
      .send({ platforms: ['ALLEGRO'] });

    expect(publishRes.status).toBe(200);
    expect(publishRes.body.results.ALLEGRO).toBe('ACTIVE');

    const platformListing = await prisma.platformListing.findUnique({
      where: { listingId_platform: { listingId: listing.id, platform: 'ALLEGRO' } },
    });
    expect(platformListing?.status).toBe('ACTIVE');
    expect(platformListing?.externalId).toContain('MOCK');

    const updatedListing = await prisma.listing.findUnique({ where: { id: listing.id } });
    expect(updatedListing?.status).toBe('ACTIVE');
  });

  it('rejects publishing to a disconnected platform', async () => {
    const category = await createCategoryWithAllegroMapping();
    const email = uniqueEmail('publish-disconnected');
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Publish Tester' });
    const cookie = cookieHeader(registerRes);
    const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);
    const userId = meRes.body.id as string;

    const listing = await prisma.listing.create({
      data: {
        userId,
        title: 'Zderzak przedni',
        description: 'Zderzak w dobrym stanie, gotowy do montażu.',
        basePrice: 300,
        condition: 'USED',
        identMethod: 'MANUAL',
        vehicleType: 'CAR',
        categoryId: category.id,
      },
    });
    await prisma.listingImage.create({
      data: { listingId: listing.id, s3Key: 'test/x.jpg', s3Bucket: 'test-bucket', order: 0, isMain: true },
    });

    const publishRes = await request(app)
      .post(`/api/listings/${listing.id}/publish`)
      .set('Cookie', cookie)
      .send({ platforms: ['ALLEGRO'] });

    expect(publishRes.status).toBe(400);
  });
});
