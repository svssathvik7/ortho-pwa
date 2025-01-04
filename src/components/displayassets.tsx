import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import ImageResult from "@/types/assetResults";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Bolt, Hand, Split, Search } from "lucide-react";

const AssetGrid = () => {
  const email = useAuthStore((state) => state.email);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await api.get(`/api/assets/get-user-assets/${email}`);
        setImages(response.data.data.images);
      } catch (error: any) {
        if (!navigator.onLine && images.length > 0) return;
        toast({
          title: error.response?.data || "An error occurred",
          variant: "destructive",
        });
      }
    };
    fetchImages();
  }, [email]);

  return (
    <div className="mt-28 px-4">
      {!isOnline && (
        <div className="bg-yellow-100 p-2 mb-4 rounded-lg text-yellow-800">
          You're currently offline. Showing cached images.
        </div>
      )}
      <div className="flex-grow w-full flex justify-center flex-wrap gap-1 overflow-y-scroll">
        {images.length === 0 ? (
          <p className="text-center w-full">No assets to see!</p>
        ) : (
          images.map((image) => (
            <div
              key={image._id}
              className="group bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 relative p-2 w-full lg:w-72"
            >
              <img
                src={image.cloudinaryUrl}
                alt={image.notes || "Asset Image"}
                className="w-full aspect-square object-cover max-h-72 cursor-pointer"
                onClick={() => setSelectedImage(image)}
              />
              <div className="w-full flex items-center justify-around absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-black bg-opacity-50">
                <Badge title="Body parts" className="w-10 h-5">
                  <Hand />
                </Badge>
                <Badge title="Implant Tags" className="w-10 h-5">
                  <Bolt />
                </Badge>
                <Badge title="Classification Tags" className="w-10 h-5">
                  <Split />
                </Badge>
                <Badge title="Diagnosis Tags" className="w-10 h-5">
                  <Search />
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog for Selected Image */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Asset Details</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <img
                src={selectedImage.cloudinaryUrl}
                alt={selectedImage.notes || "Asset Image"}
                className="w-full max-h-96 object-contain"
              />
              <div className="mt-4 text-sm text-gray-600">
                {selectedImage.notes || "No additional notes provided."}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AssetGrid;
