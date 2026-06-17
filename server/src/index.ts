import { app } from './app';
import { env } from './utils/env';
import { startWorkers } from './jobs';

app.listen(env.PORT, () => {
  console.log(`[Server] Running on port ${env.PORT} (${env.NODE_ENV})`);
  startWorkers();
});
