import AssetUploader from "@/components/assetuploader";
import AssetGrid from "@/components/displayassets";
import ImageSearch from "@/components/assetSearch"; // Import ImageSearch component
import Navbar from "@/components/navbar";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Import ShadCN Button

export default function AssetUpload() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isOnline,setIsOnline] = useState(navigator.onLine);
  const [view, setView] = useState<"upload" | "display" | "search">("upload"); // Add "search" to the state

  useEffect(() => {
    setIsOnline(navigator.onLine);
  }, [navigator.onLine]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="h-screen">
      <Navbar />
      <div className="flex absolute-centre w-fit h-72 flex-col items-center justify-center">
        <div className="flex justify-center mt-4 space-x-4 w-fit h-fit">
          <Button
            variant={view === "upload" ? "default" : "outline"}
            onClick={() => setView("upload")}
            className="px-2"
          >
            {isOnline ? "Upload Asset" : "Log in to upload"}
          </Button>
          <Button
            variant={view === "display" ? "default" : "outline"}
            onClick={() => setView("display")}
            className="px-2"
          >
            Display Assets
          </Button>
          <Button
            variant={view === "search" ? "default" : "outline"} // Add logic for "search"
            onClick={() => setView("search")}
            className="px-2"
          >
            {isOnline ? "Search Assets" : "Log in to search"}
          </Button>
        </div>
        <div className="mt-6">
          {view === "upload" && <AssetUploader />}
          {view === "display" && <AssetGrid />}
          {view === "search" && <ImageSearch />}
        </div>
      </div>
    </div>
  );
}
