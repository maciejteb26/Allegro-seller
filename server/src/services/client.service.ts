import {
  CLIENT_IMPORT_PROFILES,
  CLIENT_SEO_PROMPT_MAX_LENGTH,
  CLIENT_VAT_RATES,
} from '../constants/client.constants';
import { POPULAR_SELLER_DOMAINS } from '../constants/external-search.constants';
import { AppError } from '../middleware/error.middleware';
import { prisma } from '../utils/prisma';

export interface ClientInput {
  name: string;
  vatRate?: string;
  issuesInvoices?: boolean;
  importProfile?: string;
  seoPrompt?: string | null;
  sellerDomains?: string[];
  notes?: string | null;
  allegroReturnPolicyName?: string | null;
  allegroImpliedWarrantyName?: string | null;
}

const ALLOWED_SELLER_DOMAINS = new Set<string>(POPULAR_SELLER_DOMAINS);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'klient';
}

function validateVatRate(rate: string): void {
  if (!CLIENT_VAT_RATES.includes(rate as (typeof CLIENT_VAT_RATES)[number])) {
    throw new AppError(400, `Nieprawidłowa stawka VAT. Dozwolone: ${CLIENT_VAT_RATES.join(', ')}`);
  }
}

function validateImportProfile(profile: string): void {
  if (!CLIENT_IMPORT_PROFILES.includes(profile as (typeof CLIENT_IMPORT_PROFILES)[number])) {
    throw new AppError(400, `Nieprawidłowy profil importu. Dozwolone: ${CLIENT_IMPORT_PROFILES.join(', ')}`);
  }
}

function validateSeoPrompt(prompt: string | null | undefined): void {
  if (prompt == null || prompt === '') return;
  if (prompt.length > CLIENT_SEO_PROMPT_MAX_LENGTH) {
    throw new AppError(400, `Prompt SEO może mieć maksymalnie ${CLIENT_SEO_PROMPT_MAX_LENGTH} znaków`);
  }
}

function validateSellerDomains(domains: string[] | undefined): void {
  if (!domains?.length) return;
  const invalid = domains.filter((domain) => !ALLOWED_SELLER_DOMAINS.has(domain));
  if (invalid.length) {
    throw new AppError(400, `Nieprawidłowi sprzedawcy: ${invalid.join(', ')}`);
  }
}

function normalizeSellerDomains(domains: string[] | undefined): string[] {
  if (!domains?.length) return [];
  return [...new Set(domains.filter((domain) => ALLOWED_SELLER_DOMAINS.has(domain)))];
}

async function uniqueSlug(userId: string, base: string, excludeId?: string): Promise<string> {
  let slug = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.client.findFirst({
      where: { userId, slug, ...(excludeId ? { NOT: { id: excludeId } } : {}) },
    });
    if (!existing) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function listClients(userId: string) {
  const [clients, user] = await Promise.all([
    prisma.client.findMany({ where: { userId }, orderBy: { name: 'asc' } }),
    prisma.user.findUnique({ where: { id: userId }, select: { activeClientId: true } }),
  ]);
  return { clients, activeClientId: user?.activeClientId ?? null };
}

export async function getClientForUser(userId: string, clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, userId } });
  if (!client) throw new AppError(404, 'Klient nie istnieje');
  return client;
}

export async function createClient(userId: string, input: ClientInput) {
  const vatRate = input.vatRate ?? '23';
  const importProfile = input.importProfile ?? 'auto';
  validateVatRate(vatRate);
  validateImportProfile(importProfile);
  validateSeoPrompt(input.seoPrompt);
  validateSellerDomains(input.sellerDomains);

  const slug = await uniqueSlug(userId, slugify(input.name.trim()));
  const client = await prisma.client.create({
    data: {
      userId,
      name: input.name.trim(),
      slug,
      vatRate,
      issuesInvoices: input.issuesInvoices ?? false,
      importProfile,
      seoPrompt: input.seoPrompt?.trim() || null,
      sellerDomains: normalizeSellerDomains(input.sellerDomains),
      notes: input.notes?.trim() || null,
      allegroReturnPolicyName: input.allegroReturnPolicyName?.trim() || null,
      allegroImpliedWarrantyName: input.allegroImpliedWarrantyName?.trim() || null,
    },
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { activeClientId: true } });
  if (!user?.activeClientId) {
    await prisma.user.update({ where: { id: userId }, data: { activeClientId: client.id } });
  }

  return client;
}

export async function updateClient(userId: string, clientId: string, input: ClientInput) {
  await getClientForUser(userId, clientId);
  if (input.vatRate) validateVatRate(input.vatRate);
  if (input.importProfile) validateImportProfile(input.importProfile);
  if (input.seoPrompt !== undefined) validateSeoPrompt(input.seoPrompt);
  if (input.sellerDomains !== undefined) validateSellerDomains(input.sellerDomains);

  const slug = input.name ? await uniqueSlug(userId, slugify(input.name.trim()), clientId) : undefined;

  return prisma.client.update({
    where: { id: clientId },
    data: {
      ...(input.name ? { name: input.name.trim(), slug } : {}),
      ...(input.vatRate ? { vatRate: input.vatRate } : {}),
      ...(input.issuesInvoices !== undefined ? { issuesInvoices: input.issuesInvoices } : {}),
      ...(input.importProfile ? { importProfile: input.importProfile } : {}),
      ...(input.seoPrompt !== undefined ? { seoPrompt: input.seoPrompt?.trim() || null } : {}),
      ...(input.sellerDomains !== undefined ? { sellerDomains: normalizeSellerDomains(input.sellerDomains) } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(input.allegroReturnPolicyName !== undefined
        ? { allegroReturnPolicyName: input.allegroReturnPolicyName?.trim() || null }
        : {}),
      ...(input.allegroImpliedWarrantyName !== undefined
        ? { allegroImpliedWarrantyName: input.allegroImpliedWarrantyName?.trim() || null }
        : {}),
    },
  });
}

export async function deleteClient(userId: string, clientId: string) {
  await getClientForUser(userId, clientId);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { activeClientId: true } });

  await prisma.client.delete({ where: { id: clientId } });

  if (user?.activeClientId === clientId) {
    const next = await prisma.client.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
    await prisma.user.update({ where: { id: userId }, data: { activeClientId: next?.id ?? null } });
  }
}

export async function setActiveClient(userId: string, clientId: string) {
  await getClientForUser(userId, clientId);
  await prisma.user.update({ where: { id: userId }, data: { activeClientId: clientId } });
  return getClientForUser(userId, clientId);
}

export async function getActiveClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeClientId: true },
  });
  if (!user?.activeClientId) return null;
  return prisma.client.findFirst({ where: { id: user.activeClientId, userId } });
}
