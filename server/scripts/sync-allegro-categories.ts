/**
 * Zastępuje zaseedowane mapowania PlatformCategoryMapping (MOCK-ALLEGRO-*) realnymi
 * kategoriami Allegro, dopasowanymi po nazwie przez /sale/matching-categories.
 *
 * Wymaga: konto Allegro połączone przez OAuth (UserPlatform.isActive=true) i ALLEGRO_MOCK=false.
 * Użycie: npm run categories:sync --workspace=server -- <userId>
 */
import 'dotenv/config';
import { Platform, PrismaClient } from '@prisma/client';
import { INTERNAL_CATEGORY_TREE } from '../src/constants/internal-categories';
import { getAllegroMatchingCategories, saveAllegroMappings } from '../src/services/allegro-api.service';

const prisma = new PrismaClient();

async function resolveUserId(argUserId?: string): Promise<string> {
  if (argUserId) return argUserId;

  const active = await prisma.userPlatform.findFirst({
    where: { platform: Platform.ALLEGRO, isActive: true },
    orderBy: { connectedAt: 'desc' },
  });

  if (!active) {
    throw new Error(
      'Brak połączonego konta Allegro. Połącz konto przez OAuth (Platforms) albo podaj userId jako argument.',
    );
  }

  return active.userId;
}

async function main() {
  const userId = await resolveUserId(process.argv[2]);
  console.log(`Synchronizuję kategorie Allegro dla userId=${userId}…\n`);

  const leaves = INTERNAL_CATEGORY_TREE.flatMap((parent) =>
    parent.children.map((child) => ({ ...child, parentName: parent.name })),
  );

  const internalCategories = await prisma.internalCategory.findMany({
    where: { slug: { in: leaves.map((leaf) => leaf.slug) } },
    select: { id: true, slug: true },
  });
  const internalIdBySlug = new Map(internalCategories.map((c) => [c.slug, c.id]));

  const matched: Array<{
    internalCategoryId: string;
    externalCategoryId: string;
    externalCategoryName?: string;
  }> = [];
  const unmatched: string[] = [];

  for (const leaf of leaves) {
    const internalCategoryId = internalIdBySlug.get(leaf.slug);
    if (!internalCategoryId) {
      console.warn(`  ⚠ Brak InternalCategory dla slug=${leaf.slug} — uruchom najpierw prisma:seed`);
      continue;
    }

    try {
      const phrase = `${leaf.name} ${leaf.parentName}`.trim();
      const { data } = await getAllegroMatchingCategories(userId, phrase);
      const best = data.find((c) => c.leaf) ?? data[0];

      if (!best) {
        unmatched.push(`${leaf.parentName} / ${leaf.name}`);
        continue;
      }

      matched.push({ internalCategoryId, externalCategoryId: best.id, externalCategoryName: best.name });
      console.log(`  ✓ ${leaf.parentName} / ${leaf.name} → [${best.id}] ${best.name}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      unmatched.push(`${leaf.parentName} / ${leaf.name} (błąd: ${message})`);
    }
  }

  if (matched.length > 0) {
    await saveAllegroMappings(userId, matched);
  }

  console.log(`\nZapisano ${matched.length}/${leaves.length} mapowań.`);
  if (unmatched.length > 0) {
    console.log(`\nBrak dopasowania dla ${unmatched.length} kategorii — uzupełnij ręcznie:`);
    unmatched.forEach((name) => console.log(`  - ${name}`));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
