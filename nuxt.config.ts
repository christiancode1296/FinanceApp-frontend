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
            API_URL: process.env.NUXT_PUBLIC_API_URL
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