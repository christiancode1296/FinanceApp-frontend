import ViteTsconfigPaths from 'vite-tsconfig-paths'
import { process } from 'std-env'

export default defineNuxtConfig({
    ssr: false,

    vite: {
        plugins: [ViteTsconfigPaths()]
    },

    devServer: {
        port: 8081,
    },

    runtimeConfig: {
        public: {
            oktaBaseUrl: process.env.OKTA_BASE_URL,
            oktaClientId: process.env.OKTA_CLIENT_ID,
            oktaIssuer: process.env.OKTA_ISSUER
        }
    },
    modules: [
        'nuxt-charts',
        '@nuxt/ui'
    ],
    css: [
        '@/assets/css/main.css'
    ],
})
