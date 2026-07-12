import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// The app is served from https://<user>.github.io/Snowflake-Access-Control-Learning/
// so the base path must match the repository name for assets to resolve on Pages.
// We use it unconditionally (dev, preview and build) so `vite preview` serves the
// built site at the same base the production HTML references. Dev then runs at
// http://localhost:5173/Snowflake-Access-Control-Learning/.
export default defineConfig({
  base: '/Snowflake-Access-Control-Learning/',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
