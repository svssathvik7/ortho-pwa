import Navbar from "@/components/navbar";
import { useAuthStore } from "@/store/authStore";

export default function Home() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const email = useAuthStore((state) => state.email);

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">Revolutionize Medical Imaging Management</h1>
          <p className="mt-4 text-lg text-gray-600">
            Experience a seamless platform designed for orthopaedic surgeons to capture, organize, and analyze medical images. Our Progressive Web App ensures secure data handling, advanced tagging, and collaborative tools, all accessible across web and mobile.
          </p>
        </section>
      </div>
    </div>
  );
}
