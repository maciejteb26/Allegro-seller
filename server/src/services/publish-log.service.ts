import { Platform, PublishLogStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';

interface LogPublishAttemptInput {
  userId: string;
  platform: Platform;
  status: PublishLogStatus;
  listingId?: string;
  message?: string;
}

// Trwały log prób publikacji — obok logów w terminalu, żeby błędy (np. publikacji na Allegro)
// były widoczne od razu w tabeli Supabase, nie tylko w konsoli developera.
export async function logPublishAttempt(input: LogPublishAttemptInput): Promise<void> {
  try {
    await prisma.publishLog.create({
      data: {
        userId: input.userId,
        platform: input.platform,
        status: input.status,
        listingId: input.listingId,
        message: input.message?.slice(0, 2000),
      },
    });
  } catch {
    // Logowanie nie może wysadzić właściwej publikacji — błąd zapisu loga jest tu celowo pomijany.
  }
}
