import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import ImageResult from "@/types/assetResults";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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
  const [_selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [sharingEmail, setSharingEmail] = useState("");
  const [sharingImageId, setSharingImageId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<EditFormState>({
    bodyParts: [],
    classifications: [],
    notes: "",
    diagnosisTags: [],
    implantTags: [],
    patientAge: null,
    patientGender: "",
    clinicalHistory: "",
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImage, setDialogImage] = useState<ImageResult | null>(null);

  const handleEditClick = (image: ImageResult) => {
    setEditingImageId(image._id);
    setEditFormState({
      bodyParts: image.bodyParts,
      classifications: image.classifications,
      diagnosisTags: image.diagnoses,
      implantTags: image.implants,
      patientAge: image.patientDemographics.age,
      patientGender: image.patientDemographics.gender,
      notes: image.notes || "",
      clinicalHistory: image.clinicalHistory || ""
    });
  };

  const handleImageClick = (image: ImageResult) => {
    setDialogImage(image);
    setDialogOpen(true);
  };

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
        if (!navigator.onLine && images.length > 0) {
          return;
        }
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
        <div className="bg-yellow-100 p-3 mb-4 rounded-lg text-yellow-800">
          You're currently offline. Showing cached images.
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {images.length === 0 ? (
          <p className="text-center w-full text-gray-500">No assets to see!</p>
        ) : (
          images.map((image) => (
            <div
              key={image._id}
              className="relative group bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden transition-transform transform hover:scale-105 text-left"
              onClick={() => handleImageClick(image)}
            >
              <img
                src={image.cloudinaryUrl}
                alt={image.notes || "Asset Image"}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <div className="p-4 space-y-2">
                <p className="text-gray-700 font-semibold truncate">
                  Body part tags: {image.bodyParts.join(", ") || "None"}
                </p>
                <p className="text-gray-600 truncate">
                  Diagnosis Tags: {image.diagnoses.join(", ") || "None"}
                </p>
                <p className="text-gray-600 truncate">
                  Implant Tags: {image.implants.join(", ") || "None"}
                </p>
                <p className="text-gray-600">
                  Patient Age: {image?.patientDemographics?.age || "Unknown"}
                </p>
                <p className="text-gray-600">
                  Patient Gender: {image?.patientDemographics?.gender || "Unknown"}
                </p>
                <p className="text-gray-600 truncate">
                  Clinical History: {image.clinicalHistory || "No history available"}
                </p>
                <p className="text-gray-500 text-sm">
                  Created At: {new Date(image.createdAt).toLocaleDateString()}
                </p>
                {email !== image.owner && (
                  <p className="text-gray-500 text-sm">
                    Asset by {image.owner}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogImage?.notes || "Asset Details"}</DialogTitle>
            <DialogDescription>
              Detailed information about the selected asset.
            </DialogDescription>
          </DialogHeader>
          {dialogImage && (
            <div className="flex flex-col items-center space-y-4 max-h-96">
              <img
                src={dialogImage.cloudinaryUrl}
                alt={dialogImage.notes || "Asset Image"}
                className="max-h-96 rounded-lg object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssetGrid;
