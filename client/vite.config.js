import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// During development the React app runs on port 5173 and the Node server on
// 3000. The proxy below forwards the API and the WebSocket to the Node server,
// so from the browser's point of view everything comes from a single address.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
});
