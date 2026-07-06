import { Platform } from '@prisma/client';
import { env } from '../../utils/env';
import { getPresignedUrl } from '../image.service';
import {
  uploadImageToAllegro,
  createAllegroProductOffer,
  getAllegroCategoryParameters,
  getAllegroShippingRates,
  getAllegroImpliedWarranties,
  getAllegroReturnPolicies,
} from '../allegro-api.service';
import { BasePlatformService, ListingWithRelations, PublishResult } from './base.platform.service';
import { mockPublish } from './helpers';
import { resolveParametersWithAi, ResolvedParameter } from './allegro-attribute-ai.service';

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
): Promise<ResolvedParameter[]> {
  const { data: categoryParams } = await getAllegroCategoryParameters(userId, categoryId);
  const parameters: ResolvedParameter[] = [];
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

// Wybiera zasób po nazwie (np. "Kurier" z kolumny "Dostawa" pliku klienta, albo nazwa cennika/
// polityki ustawiona w danych klienta) dopasowanej do listy skonfigurowanej na koncie Allegro.
// Dopasowanie jest dwukierunkowe (substring w obie strony), bo nazwy w Excelu bywają skrótami
// pełnej nazwy cennika. Brak dopasowania — bierzemy pierwszy wpis z listy jako fallback.
function pickByName<T extends { id: string; name: string }>(items: T[], preferredName?: string | null): T {
  if (preferredName) {
    const needle = preferredName.trim().toLowerCase();
    const match = items.find(
      (item) => item.name.toLowerCase().includes(needle) || needle.includes(item.name.toLowerCase()),
    );
    if (match) return match;
  }
  return items[0];
}

// Allegro wymaga wskazania w ofercie już istniejących na koncie ustawień sprzedażowych — to
// nie są dane produktu, tylko konfiguracja konta zakładana w panelu Allegro (Ustawienia
// sprzedaży > Cenniki dostaw / Zwroty i reklamacje). Cennik dostaw dopasowujemy po nazwie z
// kolumny "Dostawa" pliku klienta (deliveryHint); zwroty/rękojmia to stała polityka konta, więc
// dopasowujemy je po nazwie ustawionej raz w danych klienta (Client.allegro*Name). Brak
// dopasowania po nazwie -> pierwszy skonfigurowany wpis; brak jakiegokolwiek wpisu -> publikacja
// nie może się powieść, więc informujemy o tym wprost zamiast wysyłać ofertę bez wymaganych pól.
async function resolveAfterSalesAndDelivery(
  userId: string,
  preferences: { deliveryHint?: string | null; returnPolicyName?: string | null; impliedWarrantyName?: string | null },
): Promise<{ shippingRateId: string; returnPolicyId: string; impliedWarrantyId: string }> {
  const [shippingRates, returnPolicies, impliedWarranties] = await Promise.all([
    getAllegroShippingRates(userId),
    getAllegroReturnPolicies(userId),
    getAllegroImpliedWarranties(userId),
  ]);

  const missing: string[] = [];
  if (shippingRates.data.length === 0) missing.push('cennik dostaw');
  if (returnPolicies.data.length === 0) missing.push('warunki zwrotu');
  if (impliedWarranties.data.length === 0) missing.push('warunki rękojmi');

  if (missing.length > 0) {
    throw new Error(
      `Uzupełnij w panelu Allegro (Ustawienia sprzedaży): ${missing.join(', ')} — bez tego Allegro odrzuca każdą ofertę.`,
    );
  }

  return {
    shippingRateId: pickByName(shippingRates.data, preferences.deliveryHint).id,
    returnPolicyId: pickByName(returnPolicies.data, preferences.returnPolicyName).id,
    impliedWarrantyId: pickByName(impliedWarranties.data, preferences.impliedWarrantyName).id,
  };
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
    // 1. Upload zdjęć do Allegro CDN (max 8) — bezpośredni presigned URL do S3/Supabase Storage,
    // bo to publiczny, zawsze dostępny endpoint (bez potrzeby tunelowania naszego backendu).
    const imageLocations: string[] = [];
    for (const img of listing.images.slice(0, 8)) {
      const url = await getPresignedUrl(img.s3Key);
      const location = await uploadImageToAllegro(listing.userId, url);
      imageLocations.push(location);
    }

    // 2. productSet: dopasowany produkt z katalogu Allegro, albo propozycja nowego produktu inline
    // (z EAN, gdy kategoria go wymaga i mamy prawdziwą wartość). Nazwa produktu/oferty jest
    // ograniczona przez Allegro do 75 znaków. Cennik dostaw/zwroty/rękojmia to ustawienia konta,
    // niezależne od kategorii — pobieramy je równolegle z parametrami produktu.
    const name = truncateName(listing.title);
    const [product, afterSales] = await Promise.all([
      matchedProductId
        ? Promise.resolve({ id: matchedProductId })
        : resolveProductParameters(
            listing.userId,
            categoryId,
            listing.title,
            listing.description,
            listing.catalogNumber,
          ).then((parameters) => ({
            name,
            category: { id: categoryId },
            images: imageLocations,
            parameters,
          })),
      resolveAfterSalesAndDelivery(listing.userId, {
        deliveryHint: listing.deliveryHint,
        returnPolicyName: listing.client?.allegroReturnPolicyName,
        impliedWarrantyName: listing.client?.allegroImpliedWarrantyName,
      }),
    ]);

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
      afterSalesServices: {
        impliedWarranty: { id: afterSales.impliedWarrantyId },
        returnPolicy: { id: afterSales.returnPolicyId },
      },
      delivery: {
        shippingRates: { id: afterSales.shippingRateId },
      },
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
