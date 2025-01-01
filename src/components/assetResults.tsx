import { useState } from "react";
import ImageResult from "@/types/assetResults";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge"; // Adjust this import based on your setup.

interface AssetResultsProps {
  images: ImageResult[];
}

export default function AssetResults({ images }: AssetResultsProps) {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  const closeDetails = () => setSelectedImage(null);
  const email = useAuthStore((state) => state.email);

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
            <img
              src={image.cloudinaryUrl}
              alt="Medical image"
              className="w-64 aspect-square object-contain"
            />
          </div>
        ))}
      </div>

      {/* Modal for Selected Image */}
      {selectedImage && (
        <motion.div
          initial={{ opacity: 0, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.1,
            ease: "easeOut",
          }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 w-screen"
        >
          <div className="bg-white rounded-lg shadow-md w-96 max-w-2xl p-6 relative max-h-screen h-fit overflow-y-scroll flex flex-col items-center justify-start">
            {/* Close Button */}
            <button
              onClick={closeDetails}
              className="absolute text-2xl top-2 right-2 text-red-500 hover:text-red-300"
            >
              &times;
            </button>

            {/* Image and Details */}
            <img
              src={selectedImage.cloudinaryUrl}
              alt="Selected medical image"
              className="w-64 aspect-square text-center h-auto object-contain mb-4"
            />
            <div>
              <h3 className="text-lg font-semibold">Patient Information</h3>
              <p>Age: {selectedImage.patientDemographics.age}</p>
              <p>Gender: {selectedImage.patientDemographics.gender}</p>

              {selectedImage.bodyParts.length > 0 && (
                <p className="mt-2">
                  Body Parts:
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedImage.bodyParts.map((part) => (
                      <Badge key={part}>{part}</Badge>
                    ))}
                  </div>
                </p>
              )}

              {selectedImage.diagnoses.length > 0 && (
                <p className="mt-2">
                  Diagnoses:
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedImage.diagnoses.map((diagnosis) => (
                      <Badge key={diagnosis}>{diagnosis}</Badge>
                    ))}
                  </div>
                </p>
              )}

              {selectedImage.classifications.length > 0 && (
                <p className="mt-2">
                  Classifications:
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedImage.classifications.map((classification) => (
                      <Badge key={classification}>{classification}</Badge>
                    ))}
                  </div>
                </p>
              )}

              {selectedImage.implants.length > 0 && (
                <p className="mt-2">
                  Implants:
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedImage.implants.map((implant) => (
                      <Badge key={implant}>{implant}</Badge>
                    ))}
                  </div>
                </p>
              )}

              {selectedImage.notes && (
                <div className="mt-4 p-3 border rounded-lg bg-yellow-100">
                  <h4 className="font-semibold text-yellow-700">Notes:</h4>
                  <p className="text-yellow-800">{selectedImage.notes}</p>
                </div>
              )}

              {selectedImage.owner !== email && (
                <p className="mt-2">Asset by {selectedImage.owner}</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
