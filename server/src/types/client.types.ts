export interface ClientSettingsContext {
  clientId: string;
  clientName: string;
  vatRate: string;
  issuesInvoices: boolean;
  importProfile: string;
  seoPrompt: string | null;
  sellerDomains: string[];
}
