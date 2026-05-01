import app from './app';
import { env } from './config/env';

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    🚀 Server ready at: http://localhost:${PORT}
    🛡️  Health check: http://localhost:${PORT}/api/health
    🌱 Environment: ${env.NODE_ENV}
  `);
});
