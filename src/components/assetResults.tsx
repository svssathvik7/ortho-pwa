import { useState } from "react";
import ImageResult from "../types/assetResults";
import { IsDicom } from "./displayassets";
import DICOMDisplay from "./DICOMDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Bolt, Hand, Search, Split } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface AssetResultsProps {
  images: ImageResult[];
}

export default function AssetResults({ images }: AssetResultsProps) {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);


  return (
    <div className="relative w-full h-full">
      {/* Image Grid */}
      <div className="flex w-full items-center justify-around flex-wrap p-2 gap-2">
        {images.map((image) => (
          <div
            key={image.cloudinaryUrl}
            className="bg-white rounded-lg shadow-md w-72 h-fit p-4 cursor-pointer"
            onClick={() => setSelectedImage(image)}
          >
            {IsDicom(image.cloudinaryUrl) ? <DICOMDisplay url={image.cloudinaryUrl} className="w-64 aspect-square object-contain"/> : <img
              src={image.cloudinaryUrl}
              alt="Medical image"
              className="w-64 aspect-square object-contain"
            />}
          </div>
        ))}
      </div>

      {/* Modal for Selected Image */}
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
              {IsDicom(selectedImage.cloudinaryUrl) ? <DICOMDisplay url={selectedImage.cloudinaryUrl} className=""/> : <img
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
                <TabsContent value="body-parts">
                  <span className="text-black text-xl">
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
                <TabsContent value="diagnoses">
                  <span className="text-black text-xl">
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
                <TabsContent value="classification">
                  <span className="text-black text-xl">
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
                <TabsContent value="implants">
                  <span className="text-black text-xl">
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
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
