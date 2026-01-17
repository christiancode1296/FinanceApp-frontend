<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
    <div class="max-w-md w-full">
      <UCard class="shadow-2xl">
        <div class="text-center mb-6">
          <div class="flex justify-center mb-4">
            <div class="bg-blue-500 rounded-full p-4 shadow-lg">
              <UIcon name="i-humbleicons:activity" class="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Bei stock overflow anmelden
          </h1>
        </div>

        <div id="okta-signin-widget-container"></div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import OktaSignIn from '@okta/okta-signin-widget'
import '@okta/okta-signin-widget/css/okta-sign-in.min.css'
import {navigateTo, useRouter, useRuntimeConfig } from "nuxt/app"

const router = useRouter()
const config = useRuntimeConfig()

onMounted(() => {
  const signIn = new OktaSignIn({
    baseUrl: config.public.oktaBaseUrl,
    clientId: config.public.oktaClientId,
    redirectUri: window.location.origin + '/login/callback',
    authParams: {
      issuer: config.public.oktaIssuer,
      scopes: ['openid', 'profile', 'email']
    }
  })

  signIn.showSignInToGetTokens({
    el: '#okta-signin-widget-container'
  }).then((tokens) => {
    console.log('✅ Login erfolgreich:', tokens)
    localStorage.setItem('okta-token-storage', JSON.stringify(tokens))
    signIn.remove()
    navigateTo('/stocks', {external: true})
  }).catch((error) => {
    console.error('❌ Login-Fehler:', error)
  })
})


function definePageMeta(arg0: { key: (route: { fullPath: any }) => any }) {
    throw new Error("Function not implemented.")
}
</script>

