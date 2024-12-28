import Navbar from "@/components/navbar";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const email = useAuthStore((state) => state.email);

  return (
    <div>
      <Navbar />
      <div className="px-6 py-4">
        {isAuthenticated ? (
          <h1 className="text-3xl font-bold text-center my-6">
            Welcome, {email}
          </h1>
        ) : (
          <h1 className="text-3xl font-bold text-center my-6">
            Welcome to Ortho PWA
          </h1>
        )}
      </div>
    </div>
  );
}
