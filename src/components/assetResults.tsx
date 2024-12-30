import { useState } from "react";
import ImageResult from "@/types/assetResults";
import { useAuthStore } from "@/store/authStore";

interface AssetResultsProps {
  images: ImageResult[];
}

export default function AssetResults({ images }: AssetResultsProps) {
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);

  const closeDetails = () => setSelectedImage(null);
  const email = useAuthStore((state)=>state.email);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-lg shadow-md w-3/4 max-w-2xl p-6 relative">
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
              className="w-full h-auto object-contain mb-4"
            />
            <div>
              <h3 className="text-lg font-semibold">Patient Information</h3>
              <p>Age: {selectedImage.patientDemographics.age}</p>
              <p>Gender: {selectedImage.patientDemographics.gender}</p>
              {selectedImage.bodyParts.length > 0 && (
                <p>Body Parts: {selectedImage.bodyParts.join(", ")}</p>
              )}
              {selectedImage.diagnoses.length > 0 && (
                <p>Diagnoses: {selectedImage.diagnoses.join(", ")}</p>
              )}
              {selectedImage.classifications.length > 0 && (
                <p>Classifications: {selectedImage.classifications.join(", ")}</p>
              )}
              {selectedImage.implants.length > 0 && (
                <p>Implants: {selectedImage.implants.join(", ")}</p>
              )}
              {selectedImage.notes && <p>Notes: {selectedImage.notes}</p>}
              {(selectedImage.owner!=email) ? <p>Asset by {selectedImage.owner}</p> : <></>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
