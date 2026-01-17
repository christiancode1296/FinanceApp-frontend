import OktaVue from '@okta/okta-vue'
import { OktaAuth } from '@okta/okta-auth-js'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
    const oktaAuth = new OktaAuth({
        issuer: 'https://{yourOktaDomain}/oauth2/default',
        clientId: '{yourClientId}',
        redirectUri: window.location.origin + '/login/callback',
        scopes: ['openid', 'profile', 'email']
    })

    nuxtApp.vueApp.use(OktaVue, { oktaAuth })

    return {
        provide: {
            oktaAuth
        }
    }
})
