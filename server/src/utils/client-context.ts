import { ClientSettingsContext } from '../types/client.types';

interface ClientRecord {
  id: string;
  name: string;
  vatRate: string;
  issuesInvoices: boolean;
  importProfile: string;
  seoPrompt: string | null;
  sellerDomains: string[];
  allegroReturnPolicyName: string | null;
  allegroImpliedWarrantyName: string | null;
}

export function toClientSettingsContext(client: ClientRecord): ClientSettingsContext {
  return {
    clientId: client.id,
    clientName: client.name,
    vatRate: client.vatRate,
    issuesInvoices: client.issuesInvoices,
    importProfile: client.importProfile,
    seoPrompt: client.seoPrompt,
    sellerDomains: client.sellerDomains ?? [],
    allegroReturnPolicyName: client.allegroReturnPolicyName,
    allegroImpliedWarrantyName: client.allegroImpliedWarrantyName,
  };
}
