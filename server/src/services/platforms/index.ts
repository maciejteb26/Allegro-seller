import { Platform } from '@prisma/client';
import { BasePlatformService } from './base.platform.service';
import { AllegroService } from './allegro.service';

const allegroService = new AllegroService();

export function getPlatformService(platform: Platform): BasePlatformService {
  if (platform !== Platform.ALLEGRO) {
    throw new Error(`Unsupported platform: ${platform}`);
  }
  return allegroService;
}
