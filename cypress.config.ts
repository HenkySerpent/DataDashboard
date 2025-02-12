import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:18080',
    supportFile: false
  },
  env: {
    consumerUrl: 'http//localhost:18080',
    providerUrl: 'http//localhost:28080',
  },
})
