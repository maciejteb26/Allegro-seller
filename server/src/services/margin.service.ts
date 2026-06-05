import { MarginType, Platform, Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export interface MarginRuleInput {
  platform: Platform;
  marginType: MarginType;
  marginValue: number;
}

export async function getMarginRules(userId: string) {
  const rules = await prisma.marginRule.findMany({ where: { userId } });
  return rules.map((rule) => ({ ...rule, marginValue: Number(rule.marginValue) }));
}

export async function upsertMarginRule(userId: string, rule: MarginRuleInput) {
  const saved = await prisma.marginRule.upsert({
    where: { userId_platform: { userId, platform: rule.platform } },
    create: { userId, ...rule, marginValue: new Prisma.Decimal(rule.marginValue) },
    update: { marginType: rule.marginType, marginValue: new Prisma.Decimal(rule.marginValue) },
  });
  return { ...saved, marginValue: Number(saved.marginValue) };
}

export function calculateFinalPrice(basePrice: number, rule: MarginRuleInput | null): number {
  if (!rule) return basePrice;
  if (rule.marginType === 'PERCENTAGE') {
    return Number((basePrice * (1 + rule.marginValue / 100)).toFixed(2));
  }
  return Number((basePrice + rule.marginValue).toFixed(2));
}
