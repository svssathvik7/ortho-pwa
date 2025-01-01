import AssetUploader from "@/components/assetuploader";
import AssetGrid from "@/components/displayassets";
import ImageSearch from "@/components/assetSearch"; // Import ImageSearch component
import Navbar from "@/components/navbar";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"; // Import ShadCN Tabs

export default function AssetUpload() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="h-screen">
      <Navbar />
      <div className="flex absolute-centre w-fit h-72 flex-col items-center justify-center">
        <Tabs defaultValue="upload" className="w-fit flex items-center justify-center flex-col">
          <TabsList className="flex justify-center mt-4 space-x-4 w-fit h-fit">
            <TabsTrigger value="upload" disabled={!navigator.onLine}>
              {navigator.onLine ? "Upload Asset" : "Log in to upload"}
            </TabsTrigger>
            <TabsTrigger value="display">Display Assets</TabsTrigger>
            <TabsTrigger value="search" disabled={!navigator.onLine}>
              {navigator.onLine ? "Search Assets" : "Log in to search"}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload">
            <AssetUploader />
          </TabsContent>
          <TabsContent value="display">
            <AssetGrid />
          </TabsContent>
          <TabsContent value="search">
            <ImageSearch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
