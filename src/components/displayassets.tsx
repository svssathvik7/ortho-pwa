import React, { useEffect, useState } from "react";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Share2, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import ImageResult from "@/types/assetResults";

// Interface for edit form state to ensure type safety
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
  const [sharingEmail, setSharingEmail] = useState("");
  const [sharingImageId, setSharingImageId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // New state for edit functionality
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editFormState, setEditFormState] = useState<EditFormState>({
    bodyParts: [],
    classifications: [],
    notes: "",
    diagnosisTags: [],
    implantTags: [],
    patientAge: null,
    patientGender: "",
    clinicalHistory: ""
  });

  // Existing effects remain the same...
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
        console.log(response.data.data.images); 
      } catch (error:any) {
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

  // Existing share and revoke handlers remain the same...
  const handleShareAccess = async () => {
    if (!sharingEmail.trim() || !sharingImageId) return;

    try {
      await api.post(`/api/assets/${sharingImageId}/share`, {
        email: sharingEmail.trim(),
        permission: "view",
        owner: email,
      });

      setImages((prevImages) =>
        prevImages.map((img) =>
          img._id === sharingImageId
            ? {
                ...img,
                sharedWith: [...(img.sharedWith || []), sharingEmail.trim()],
              }
            : img
        )
      );

      setSharingEmail("");
      toast({ title: "Access granted successfully" });
    } catch (error) {
      toast({
        title: "Failed to grant access",
        variant: "destructive",
      });
    }
  };

  const handleRevokeAccess = async () => {
    if (!sharingEmail.trim() || !sharingImageId) return;

    try {
      await api.post(`/api/assets/${sharingImageId}/revoke`, {
        email: sharingEmail.trim(),
        permission: "view",
        owner: email,
      });

      setSharingEmail("");
      toast({ title: "Access revoked successfully" });
    } catch (error) {
      console.log(error);
      toast({
        title: "Failed to revoke access",
        variant: "destructive",
      });
    }
  };

  // New handler for initializing edit mode
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

  // New handler for updating the asset
  const handleUpdateAsset = async () => {
    if (!editingImageId) return;
    console.log(editFormState);
    try {
      await api.post(`/api/assets/${editingImageId}/update`, {
        formState: editFormState,
        owner: email
      });

      setImages((prevImages) =>
        prevImages.map((img) =>
          img._id === editingImageId ? { ...img, ...editFormState } : img
        )
      );

      setEditingImageId(null);
      toast({ title: "Asset updated successfully" });
    } catch (error) {
      toast({
        title: "Failed to update asset",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="m-auto h-96 p-6 flex items-center justify-center w-screen flex-wrap overflow-y-scroll">
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
              className="group bg-white shadow-lg rounded-lg overflow-y-scroll border border-gray-200 relative p-2 w-full lg:min-h-fit lg:w-72"
            >
              <img
                src={image.cloudinaryUrl}
                alt={image.notes || "Asset Image"}
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="space-y-2">
                  <p className="text-gray-200">
                    Body part tags: {image.bodyParts.join(", ") || "None"}
                  </p>
                  <p className="text-gray-200">
                    Diagnosis Tags: {image.diagnoses.join(", ") || "None"}
                  </p>
                  <p className="text-gray-200">
                    Implant Tags: {image.implants.join(", ") || "None"}
                  </p>
                  <p className="text-gray-200">
                    Patient Age: {image?.patientDemographics?.age || "Unknown"}
                  </p>
                  <p className="text-gray-200">
                    Patient Gender: {image?.patientDemographics?.gender || "Unknown"}
                  </p>
                  <p className="text-gray-200">
                    Clinical History:{" "}
                    {image.clinicalHistory || "No history available"}
                  </p>

                  <p className="text-gray-400 text-sm">
                    Created At: {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                  {email !== image.owner && (
                    <p className="text-gray-400 text-sm">
                      Asset by {image.owner}
                    </p>
                  )}
                </div>
                {isOnline && (
                  <div className="flex justify-end gap-2 mt-4">
                    {/* Edit Dialog */}
                    <Dialog
                      open={editingImageId === image._id}
                      onOpenChange={(isOpen) => {
                        if (!isOpen) setEditingImageId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className={`${
                            email !== image?.owner ? "hidden" : "flex"
                          } items-center gap-2 px-2`}
                          onClick={() => handleEditClick(image)}
                          disabled={email !== image?.owner}
                        >
                          <Edit className="w-4 h-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Asset</DialogTitle>
                        </DialogHeader>
                        <div>
                          <label className="text-sm font-medium">
                            Body-part tags (comma-separated)
                          </label>
                          <Input
                            value={editFormState.bodyParts.join(", ")}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                bodyParts: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim()),
                              }))
                            }
                            placeholder="e.g. Head, Neck"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Implant Tags (comma-separated)
                          </label>
                          <Input
                            value={editFormState.classifications.join(", ")}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                classifications: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim()),
                              }))
                            }
                            placeholder="e.g. Fracture, Dislocation"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Diagnosis Tags (comma-separated)
                          </label>
                          <Input
                            value={editFormState.diagnosisTags.join(", ")}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                diagnosisTags: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim()),
                              }))
                            }
                            placeholder="e.g. Fracture, Dislocation"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Implant Tags (comma-separated)
                          </label>
                          <Input
                            value={editFormState.implantTags.join(", ")}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                implantTags: e.target.value
                                  .split(",")
                                  .map((tag) => tag.trim()),
                              }))
                            }
                            placeholder="e.g. Titanium, Plate"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Patient Age
                          </label>
                          <Input
                            type="number"
                            value={editFormState.patientAge || ""}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                patientAge: Number(e.target.value) || null,
                              }))
                            }
                            placeholder="e.g. 35"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Patient Gender
                          </label>
                          <select
                            value={editFormState.patientGender}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                patientGender: e.target.value,
                              }))
                            }
                            className="w-full p-2 border rounded"
                          >
                            <option value={""}>Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">
                            Clinical History
                          </label>
                          <Textarea
                            value={editFormState.clinicalHistory}
                            onChange={(e) =>
                              setEditFormState((prev) => ({
                                ...prev,
                                clinicalHistory: e.target.value,
                              }))
                            }
                            placeholder="Add clinical history..."
                          />
                        </div>
                        <Button onClick={handleUpdateAsset}>Update</Button>
                      </DialogContent>
                    </Dialog>

                    {/* Existing Share Dialog */}
                    <Dialog
                      open={sharingImageId === image._id}
                      onOpenChange={(isOpen) => {
                        if (!isOpen) setSharingImageId(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className={`${
                            email !== image?.owner ? "hidden" : "flex"
                          } items-center gap-2 px-2`}
                          onClick={() => {
                            setSelectedImage(image);
                            setSharingImageId(image._id);
                          }}
                          disabled={email !== image?.owner}
                        >
                          <Share2 className="w-4 h-4" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Access</DialogTitle>
                        </DialogHeader>
                        <Tabs defaultValue="share">
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="share">
                              Share Access
                            </TabsTrigger>
                            <TabsTrigger value="revoke">
                              Revoke Access
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="share">
                            <div className="flex gap-2">
                              <Input
                                type="email"
                                value={sharingEmail}
                                onChange={(e) =>
                                  setSharingEmail(e.target.value)
                                }
                                placeholder="Enter email to share"
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleShareAccess()
                                }
                              />
                              <Button
                                onClick={handleShareAccess}
                                className="px-2"
                              >
                                Share
                              </Button>
                            </div>
                          </TabsContent>
                          <TabsContent value="revoke">
                            <div className="flex gap-2">
                              <Input
                                type="email"
                                value={sharingEmail}
                                onChange={(e) =>
                                  setSharingEmail(e.target.value)
                                }
                                placeholder="Enter email to revoke"
                                onKeyPress={(e) =>
                                  e.key === "Enter" && handleRevokeAccess()
                                }
                              />
                              <Button
                                onClick={handleRevokeAccess}
                                variant="destructive"
                                className="px-2"
                              >
                                Revoke
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetGrid;
