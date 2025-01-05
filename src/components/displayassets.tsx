import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import ImageResult from "@/types/assetResults";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Bolt, Hand, Split, Search } from "lucide-react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import DICOMDisplay from "./DICOMDisplay";

export const IsDicom = (url: string): boolean => {
  return (
    url?.endsWith(".dcm") || url?.endsWith(".dicom") || url?.endsWith(".dicm")
  );
};

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
              className="group bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 relative p-2 w-full lg:w-72"
            >
              {!IsDicom(image.cloudinaryUrl) ? (
                <img
                  src={image.cloudinaryUrl}
                  alt={image.patientDemographics.notes || "Asset Image"}
                  className="w-full aspect-square object-cover max-h-72 cursor-pointer"
                  onClick={() => setSelectedImage(image)}
                />
              ) : (
                <div onClick={() => setSelectedImage(image)}>
                  <DICOMDisplay url={image.cloudinaryUrl}/>
                </div>
              )}

              <div className="hidden w-full lg:flex items-center justify-around absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 bg-black bg-opacity-50">
                <HoverCard>
                  <HoverCardTrigger>
                    <Badge
                      title="Body parts"
                      className="w-10 h-5 cursor-pointer"
                    >
                      <Hand />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="top"
                    align="center"
                    className="bg-white border border-gray-200 rounded-md p-2 shadow-lg text-xs text-gray-700 flex flex-col gap-1"
                  >
                    <span className="text-black text-xl">
                      {image.bodyParts.length == 0 && "No"} Body tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {image.bodyParts.map((part) => (
                        <p className="rounded-full bg-yellow-500 text-white px-2">
                          {part}
                        </p>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger>
                    <Badge
                      title="Implant Tags"
                      className="w-10 h-5 cursor-pointer"
                    >
                      <Bolt />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="top"
                    align="center"
                    className="bg-white border border-gray-200 rounded-md p-2 shadow-lg text-xs text-gray-700"
                  >
                    <span className="text-black text-xl">
                      {image.implants.length == 0 && "No"} Implant tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {image.implants.map((implant) => (
                        <p className="rounded-full bg-yellow-500 text-white px-2">
                          {implant}
                        </p>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger>
                    <Badge
                      title="Classification Tags"
                      className="w-10 h-5 cursor-pointer"
                    >
                      <Split />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="top"
                    align="center"
                    className="bg-white border border-gray-200 rounded-md p-2 shadow-lg text-xs text-gray-700"
                  >
                    <span className="text-black text-xl">
                      {image.classifications.length == 0 && "No"} Classification
                      tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {image.classifications.map((classification) => (
                        <p className="rounded-full bg-yellow-500 text-white px-2">
                          {classification}
                        </p>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
                <HoverCard>
                  <HoverCardTrigger>
                    <Badge
                      title="Diagnoses Tags"
                      className="w-10 h-5 cursor-pointer"
                    >
                      <Search />
                    </Badge>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="top"
                    align="center"
                    className="bg-white border border-gray-200 rounded-md p-2 shadow-lg text-xs text-gray-700"
                  >
                    <span className="text-black text-xl">
                      {image.diagnoses.length == 0 && "No"} Diagnoses tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {image.diagnoses.map((diagnoses) => (
                        <p className="rounded-full bg-yellow-500 text-white px-2">
                          {diagnoses}
                        </p>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog for Selected Image */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-[80dvw] max-h-[70dvh] overflow-y-scroll">
            <DialogHeader>
              <DialogTitle>Asset Details</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center overflow-y-scroll">
              {IsDicom(selectedImage.cloudinaryUrl) ? <DICOMDisplay url={selectedImage.cloudinaryUrl} className="w-full max-h-96 object-contain"/> : <img
                src={selectedImage.cloudinaryUrl}
                alt={selectedImage.patientDemographics.notes || "Asset Image"}
                className="w-full max-h-96 object-contain"
              />}
              <Tabs className="w-full flex-wrap" defaultValue="body-parts">
                <TabsList className="flex-wrap w-full m-2">
                  <TabsTrigger className="w-1/4" value="body-parts">
                    <Hand />
                  </TabsTrigger>
                  <TabsTrigger className="w-1/4" value="diagnoses">
                    <Search />
                  </TabsTrigger>
                  <TabsTrigger className="w-1/4" value="classification">
                    <Split />
                  </TabsTrigger>
                  <TabsTrigger className="w-1/4" value="implants">
                    <Bolt />
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="body-parts" className="flex items-center justify-start">
                  <span className="text-black text-xl m-2">
                    {selectedImage.bodyParts.length == 0 && "No"} Body tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.bodyParts.map((part) => (
                      <p className="rounded-full bg-yellow-500 text-white px-2">
                        {part}
                      </p>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="diagnoses" className="flex items-center justify-start">
                  <span className="text-black text-xl m-2">
                    {selectedImage.diagnoses.length == 0 && "No"} Diagnoses tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.diagnoses.map((diagnoses) => (
                      <p className="rounded-full bg-yellow-500 text-white px-2">
                        {diagnoses}
                      </p>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="classification" className="flex items-center justify-start">
                  <span className="text-black text-xl m-2">
                    {selectedImage.classifications.length == 0 && "No"}{" "}
                    Classification tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.classifications.map((classification) => (
                      <p className="rounded-full bg-yellow-500 text-white px-2">
                        {classification}
                      </p>
                    ))}
                  </div>
                </TabsContent>
                <TabsContent value="implants" className="flex items-center justify-start">
                  <span className="text-black text-xl m-2">
                    {selectedImage.implants.length == 0 && "No"} Implant tags
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {selectedImage.implants.map((implant) => (
                      <p className="rounded-full bg-yellow-500 text-white px-2">
                        {implant}
                      </p>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              <div className="w-full text-left flex items-center justify-start m-2"><p className="text-lg">Clinical history: </p><span className="bg-yellow-200 p-2 m-2">{selectedImage.patientDemographics.clinical_history}</span></div>
              <div className="w-full text-left flex items-center justify-start m-2"><p className="text-lg">Notes: </p><span className="bg-yellow-200 p-2 m-2">{selectedImage.patientDemographics.notes}</span></div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AssetGrid;
