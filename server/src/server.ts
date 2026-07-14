import app from './app';
import { env } from './config/env';
import * as http from 'http';
import { setupSocket } from './socket';
import { storageService } from './shared/storage/storage.service';

const PORT = env.PORT || 5000;

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

// Initialize Socket.io on the HTTP server
setupSocket(server);

// Ensure the object-storage bucket exists (no-op / disk fallback when MinIO is off)
storageService.init().catch(() => undefined);

// Listen on the HTTP server, not the raw Express app
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
    🚀 Server ready at: http://0.0.0.0:${PORT}
    🛡️  Health check: http://0.0.0.0:${PORT}/api/health
    🌱 Environment: ${env.NODE_ENV}
  `);
});
