import Navbar from "../components/navbar";

export default function Home() {

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        {/* Hero Section */}
        <section className="text-center flex items-center justify-center flex-col">
          <h1 className="text-4xl font-bold text-gray-800">Revolutionize Medical Imaging Management</h1>
          <p className="mt-4 text-lg text-gray-600 w-3/4 text-center">
            Experience a seamless platform designed for orthopaedic surgeons to capture, organize, and analyze medical images. Our Progressive Web App ensures secure data handling, advanced tagging, and collaborative tools, all accessible across web and mobile.
          </p>
        </section>
      </div>
    </div>
  );
}
