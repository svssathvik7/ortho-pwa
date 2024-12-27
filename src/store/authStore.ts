import { create } from "zustand"
import { persist } from "zustand/middleware"

type AuthState = {
    isAuthenticated: boolean,
    email: string | null,
    login: (username:string) => void,
    logout: () => void
}



export const useAuthStore = create<AuthState>()(
    persist(
        (set)=>({
            isAuthenticated: false,
            email: null,
            login: (email:string) => set({
                isAuthenticated: true,
                email: email
            }),
            logout: () => set({
                isAuthenticated: false,
                email: null
            })
        }),
        {
            name: "auth-storage",
        }
    )
)