import ViteTsconfigPaths from 'vite-tsconfig-paths'
import { process } from 'std-env'

// @ts-ignore
// @ts-ignore
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
            oktaIssuer: process.env.OKTA_ISSUER,
            API_URL: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:8080',
        }
    },
    modules: [
        'nuxt-charts',
        '@nuxt/ui'
    ],
    css: [
        '@/assets/css/main.css'
    ],
    plugins: [
        { src: '~/plugins/okta.client.ts', mode: 'client' }
    ]
})
