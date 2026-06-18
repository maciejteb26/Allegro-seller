import { NextFunction, Request, Response } from 'express';
import { Platform } from '@prisma/client';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../utils/prisma';
import * as allegroApiService from '../services/allegro-api.service';
import { encrypt } from '../utils/crypto';
import * as allegroOAuthService from '../services/allegro-oauth.service';
import { env } from '../utils/env';

function userId(req: Request): string {
  return (req as AuthRequest).userId;
}

const saveMappingsSchema = z.object({
  items: z.array(
    z.object({
      internalCategoryId: z.string().min(1),
      externalCategoryId: z.string().min(1),
      externalCategoryName: z.string().optional(),
      attributeSchema: z.record(z.unknown()).optional(),
    }),
  ),
});

export async function getPlatforms(req: Request, res: Response, next: NextFunction) {
  try {
    const platforms = await prisma.userPlatform.findMany({
      where: { userId: userId(req) },
      orderBy: { platform: 'asc' },
    });
    res.json(platforms);
  } catch (error) {
    next(error);
  }
}

export async function connectPlatform(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = req.params.platform as Platform;
    if (platform !== Platform.ALLEGRO) {
      res.status(400).json({ error: 'Unsupported platform' });
      return;
    }
    if (!env.ALLEGRO_MOCK) {
      res.status(400).json({
        error: 'Use Allegro OAuth flow. Call /api/platforms/allegro/oauth/start and open authorizationUrl.',
      });
      return;
    }

    const accessToken =
      typeof req.body?.accessToken === 'string' && req.body.accessToken.trim()
        ? encrypt(req.body.accessToken.trim())
        : undefined;
    const connected = await prisma.userPlatform.upsert({
      where: { userId_platform: { userId: userId(req), platform } },
      create: { userId: userId(req), platform, isActive: true, connectedAt: new Date(), accessToken },
      update: { isActive: true, connectedAt: new Date(), ...(accessToken && { accessToken }) },
    });
    res.status(201).json(connected);
  } catch (error) {
    next(error);
  }
}

export async function disconnectPlatform(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = req.params.platform as Platform;
    await prisma.userPlatform.update({
      where: { userId_platform: { userId: userId(req), platform } },
      data: { isActive: false },
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function getAllegroCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const parentId = typeof req.query.parentId === 'string' ? req.query.parentId : undefined;
    const result = await allegroApiService.getAllegroCategories(userId(req), parentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function saveAllegroMappings(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = saveMappingsSchema.parse(req.body);
    const result = await allegroApiService.saveAllegroMappings(userId(req), payload.items);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getAllegroOAuthStart(req: Request, res: Response, next: NextFunction) {
  try {
    const authorizationUrl = allegroOAuthService.buildAuthorizationUrl(userId(req));
    res.json({ authorizationUrl });
  } catch (error) {
    next(error);
  }
}

export async function getAllegroOAuthCallback(req: Request, res: Response, _next: NextFunction) {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    if (!code || !state) {
      res.send(oauthHtml('error', 'ALLEGRO', 'Brak parametrow autoryzacji'));
      return;
    }
    await allegroOAuthService.exchangeCodeAndStoreConnection(code, state);
    res.send(oauthHtml('success', 'ALLEGRO'));
  } catch (_error) {
    res.send(oauthHtml('error', 'ALLEGRO', 'Blad wymiany tokenu'));
  }
}

export async function testPlatformConnection(req: Request, res: Response, next: NextFunction) {
  try {
    const platform = req.params.platform.toUpperCase() as Platform;
    if (platform !== Platform.ALLEGRO) {
      res.status(400).json({ error: 'Unsupported platform' });
      return;
    }
    const record = await prisma.userPlatform.findUnique({
      where: { userId_platform: { userId: userId(req), platform } },
    });
    if (!record?.isActive) {
      res.status(400).json({ error: 'Platforma niepodlaczona' });
      return;
    }
    if (!env.ALLEGRO_MOCK) {
      const me = await allegroApiService.getAllegroMe(userId(req));
      res.json({ ok: true, message: `Allegro: zalogowany jako ${me.login}` });
      return;
    }
    res.json({ ok: true, message: 'Allegro: polaczenie aktywne (MOCK)' });
  } catch (error) {
    next(error);
  }
}

function oauthHtml(status: 'success' | 'error', platform: string, message?: string): string {
  const msg = status === 'success' ? 'Polaczono! Zamykanie...' : `Blad: ${message ?? 'Sprobuj ponownie.'}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>OAuth</title></head><body>
<p style="font-family:sans-serif;padding:40px;text-align:center">${msg}</p>
<script>
if(window.opener){
  window.opener.postMessage({type:'OAUTH_CONNECTED',platform:'${platform}',status:'${status}'},'*');
  window.close();
}else{
  setTimeout(function(){window.location.href='${env.CLIENT_URL}/platforms';},1500);
}
</script>
</body></html>`;
}
