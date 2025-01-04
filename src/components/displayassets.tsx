import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import ImageResult from "@/types/assetResults";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Edit } from "lucide-react";
import { Input } from "./ui/input";

interface EditFormState {
  bodyParts: string[];
  classifications: string[];
  notes: string;
  diagnosisTags: string[];
  implantTags: string[];
  patientAge: number | null;
  patientGender: string;
  clinicalHistory: string;
}

const AssetGrid = () => {
  const email = useAuthStore((state) => state.email);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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
      } catch (error:any) {
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
              className="group bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 relative p-2 w-full lg:min-h-fit lg:w-72"
            >
              <img
                src={image.cloudinaryUrl}
                alt={image.notes || "Asset Image"}
                className="w-full aspect-square object-cover"
              />
              <Dialog>
                <DialogTrigger asChild>
                  <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer">
                    <p className="text-white text-lg font-bold">View Image</p>
                  </div>
                </DialogTrigger>
                <DialogContent
                  onOpenAutoFocus={(event) => event.preventDefault()}
                  onCloseAutoFocus={(event) => event.preventDefault()}
                  className="bg-white p-4 rounded-lg w-full max-w-2xl mx-auto"
                >
                  <DialogHeader>
                    <DialogTitle>Asset Image</DialogTitle>
                  </DialogHeader>
                  <div className="flex justify-center">
                    <img
                      src={image.cloudinaryUrl}
                      alt={image.notes || "Asset Image"}
                      className="w-full max-h-[80vh] object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetGrid;

