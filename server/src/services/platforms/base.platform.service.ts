import { Platform, Prisma } from '@prisma/client';
import * as categoryService from '../category.service';

export interface PublishResult {
  externalId: string;
  externalUrl: string;
  status: 'ACTIVE';
}

export type ListingWithRelations = Prisma.ListingGetPayload<{
  include: { category: true; images: true };
}>;

export abstract class BasePlatformService {
  abstract platform: Platform;
  abstract mockMode: boolean;

  async publishListing(listing: ListingWithRelations, categoryId: string): Promise<PublishResult> {
    if (this.mockMode) {
      return this._mockPublish(listing);
    }

    const attributeSchema = await categoryService.getAttributeSchema(listing.categoryId, this.platform);
    this.buildPayload(listing, categoryId, attributeSchema);
    return this._realPublish(listing, categoryId);
  }

  async endListing(_externalId: string): Promise<void> {
    return Promise.resolve();
  }

  protected abstract _mockPublish(listing: ListingWithRelations): Promise<PublishResult>;
  protected abstract _realPublish(listing: ListingWithRelations, categoryId: string): Promise<PublishResult>;

  buildPayload(listing: ListingWithRelations, categoryId: string, attributeSchema: object): object {
    return {
      title: listing.title,
      description: listing.description,
      categoryId,
      attributes: attributeSchema,
      basePrice: Number(listing.basePrice),
    };
  }
}
