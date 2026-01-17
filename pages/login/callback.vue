<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="w-12 h-12 animate-spin mx-auto mb-4" />
      <p class="text-lg">Authentifizierung läuft...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { OktaAuth } from '@okta/okta-auth-js'
import {useRouter, useRuntimeConfig } from "nuxt/app"

const router = useRouter()
const config = useRuntimeConfig()

onMounted(async () => {
  const oktaAuth = new OktaAuth({
    issuer: config.public.oktaIssuer as string,
    clientId: config.public.oktaClientId as string,
    redirectUri: window.location.origin + '/login/callback'
  })

  try {
    await oktaAuth.handleLoginRedirect()
    await router.push('/dashboard')
  } catch (error) {
    console.error('Callback-Fehler:', error)
    await router.push('/')
  }
})
</script>


