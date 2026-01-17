// @ts-ignore
import { useOktaAuth } from '@okta/okta-vue'
import { computed, ref, onMounted } from 'vue'

export const useAuth = () => {
    const oktaAuth = useOktaAuth()
    const isAuthenticated = ref(false)

    onMounted(async () => {
        isAuthenticated.value = await oktaAuth.authState?.isAuthenticated ?? false
    })

    oktaAuth.authState$?.subscribe((authState: { isAuthenticated: boolean }) => {
        isAuthenticated.value = authState?.isAuthenticated ?? false
    })

    const logout = async () => {
        await oktaAuth.signOut()
    }

    return {
        isAuthenticated: computed(() => isAuthenticated.value),
        logout
    }
}
