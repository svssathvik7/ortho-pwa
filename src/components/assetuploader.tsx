import { useEffect, useState } from "react";
import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";
import { Tabs } from "@radix-ui/react-tabs";
import { TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

export default function AssetUploader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  return (
    <div className="mt-28 flex items-center justify-center">
      {isOnline ? (
        <Tabs defaultValue="camera" className="w-screen lg:w-3/4">
          <TabsList className="flex justify-center bg-opacity-30">
            <TabsTrigger className="w-full" value="camera">Camera Upload</TabsTrigger>
            <TabsTrigger className="w-full" value="file">File Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="camera" className="p-4">
            <CameraCapture />
          </TabsContent>
          <TabsContent value="file" className="p-4">
            <FileUploader />
          </TabsContent>
        </Tabs>
      ) : (
        <p>Please connect to the internet to upload assets.</p>
      )}
    </div>
  );
}
