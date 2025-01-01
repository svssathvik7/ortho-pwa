import { create } from "zustand"
import { persist } from "zustand/middleware"

type AuthState = {
    isAuthenticated: boolean,
    dp: string | null,
    email: string | null,
    login: (username:string, dp:string|null) => void,
    logout: () => void
}



export const useAuthStore = create<AuthState>()(
    persist(
        (set)=>({
            isAuthenticated: false,
            email: null,
            dp: null,
            login: (email:string,dp: string|null) => set({
                isAuthenticated: true,
                dp,
                email
            }),
            logout: () => set({
                isAuthenticated: false,
                dp: null,
                email: null
            })
        }),
        {
            name: "auth-storage",
        }
    )
)