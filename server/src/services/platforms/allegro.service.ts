import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { buildPublicImageUrl } from '../../utils/image-public-token';
import {
  uploadImageToAllegro,
  createAllegroProductOffer,
  getAllegroCategoryParameters,
} from '../allegro-api.service';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';
import { resolveParametersWithAi } from './allegro-attribute-ai.service';

const ALLEGRO_WEB = env.ALLEGRO_SANDBOX
  ? 'https://allegro.pl.allegrosandbox.pl'
  : 'https://allegro.pl';

const EAN_PATTERN = /^\d{8}$|^\d{12,14}$/;
const VOLUME_PATTERN = /(\d+(?:[.,]\d+)?)\s*(ml|l|kg|g)\b/i;
const ALLEGRO_NAME_MAX_LENGTH = 75;

function truncateName(name: string): string {
  return name.length > ALLEGRO_NAME_MAX_LENGTH ? name.slice(0, ALLEGRO_NAME_MAX_LENGTH).trimEnd() : name;
}

// Dla nowej propozycji produktu (brak dopasowania w katalogu) kategoria może wymagać dowolnego
// zestawu atrybutów. Najpierw tanie, pewne reguły (EAN, pojemność/waga z tytułu), a to czego nie
// da się ustalić regułami — w tym pola słownikowe (marka, smak...) — dopytujemy AI, które wybiera
// wyłącznie spośród realnych opcji słownika danej kategorii (nigdy dowolny tekst).
async function resolveProductParameters(
  userId: string,
  categoryId: string,
  title: string,
  description: string,
  catalogNumber: string | null,
): Promise<Array<{ id: string; values: string[] }>> {
  const { data: categoryParams } = await getAllegroCategoryParameters(userId, categoryId);
  const parameters: Array<{ id: string; values: string[] }> = [];
  const unresolved: typeof categoryParams = [];

  for (const param of categoryParams) {
    // "Stan" to atrybut oferty (payload.parameters), nie produktu — Allegro odrzuca go
    // w productSet.product.parameters niezależnie od wybranej wartości.
    if (!param.required || param.name.toLowerCase() === 'stan') continue;

    if (param.name.toLowerCase().includes('ean') && catalogNumber && EAN_PATTERN.test(catalogNumber)) {
      parameters.push({ id: param.id, values: [catalogNumber] });
      continue;
    }

    const isVolumeLike = /pojemność|objętość|waga|masa/i.test(param.name);
    const volumeMatch = isVolumeLike && !param.dictionary?.length ? title.match(VOLUME_PATTERN) : null;
    if (volumeMatch) {
      parameters.push({ id: param.id, values: [`${volumeMatch[1]} ${volumeMatch[2]}`] });
      continue;
    }

    unresolved.push(param);
  }

  if (unresolved.length > 0) {
    const aiResolved = await resolveParametersWithAi(unresolved, { title, description });
    parameters.push(...aiResolved);
  }

  return parameters;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Allegro wymaga, by element opisu typu TEXT zawierał poprawny HTML (np. <p>...</p>) —
// goły tekst bez znaczników odrzuca jako "Nieprawidłowy podzbiór HTML". Sekcja może mieć
// maksymalnie 2 elementy, więc wszystkie akapity łączymy w jeden TEXT.
function toAllegroDescriptionItems(description: string): Array<{ type: 'TEXT'; content: string }> {
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const content = (paragraphs.length > 0 ? paragraphs : [description])
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');

  return [{ type: 'TEXT', content }];
}

export class AllegroService extends BasePlatformService {
  platform: Platform = 'ALLEGRO';
  mockMode = env.ALLEGRO_MOCK;

  protected async _mockPublish(_listing: ListingWithRelations): Promise<PublishResult> {
    // MOCK MODE — wymaga ALLEGRO_MOCK=false i prawdziwego tokenu
    return mockPublish(this.platform, 'https://allegro.pl/oferta');
  }

  protected async _realPublish(
    listing: ListingWithRelations,
    categoryId: string,
    matchedProductId?: string,
  ): Promise<PublishResult> {
    // 1. Upload zdjęć do Allegro CDN (max 8)
    const imageLocations: string[] = [];
    for (const img of listing.images.slice(0, 8)) {
      const url = buildPublicImageUrl(img.id);
      const location = await uploadImageToAllegro(listing.userId, url);
      imageLocations.push(location);
    }

    // 2. productSet: dopasowany produkt z katalogu Allegro, albo propozycja nowego produktu inline
    // (z EAN, gdy kategoria go wymaga i mamy prawdziwą wartość). Nazwa produktu/oferty jest
    // ograniczona przez Allegro do 75 znaków.
    const name = truncateName(listing.title);
    const product = matchedProductId
      ? { id: matchedProductId }
      : {
          name,
          category: { id: categoryId },
          images: imageLocations,
          parameters: await resolveProductParameters(
            listing.userId,
            categoryId,
            listing.title,
            listing.description,
            listing.catalogNumber,
          ),
        };

    // 3. Buduj payload oferty (POST /sale/product-offers — aktualny endpoint, oparty o katalog produktów).
    const payload = {
      productSet: [{ product }],
      category: { id: categoryId },
      parameters: [],
      name,
      description: {
        sections: [{ items: toAllegroDescriptionItems(listing.description) }],
      },
      sellingMode: {
        format: 'BUY_NOW',
        price: { amount: Number(listing.basePrice).toFixed(2), currency: listing.currency },
      },
      stock: { available: listing.quantity, unit: 'UNIT' },
      publication: { status: 'ACTIVE' },
    };

    // 4. Wyślij ofertę
    const offer = await createAllegroProductOffer(listing.userId, payload);

    return {
      externalId: offer.id,
      externalUrl: `${ALLEGRO_WEB}/oferta/${offer.id}`,
      status: 'ACTIVE',
    };
  }
}
