import ImageResult from "@/types/assetResults";

interface AssetResultsProps {
  images: ImageResult[];
}

export default function AssetResults({ images }: AssetResultsProps) {
  return (
    <div className="flex items-center justify-center w-3/4 h-full p-2 gap-2">
      {images.map((image) => (
        <div key={image.cloudinaryUrl} className="bg-white rounded-lg shadow-md overflow-hidden">
          <img
            src={image.cloudinaryUrl}
            alt="Medical image"
            className="w-full h-48 object-cover"
          />
          <div className="p-4">
            <h3 className="text-lg font-semibold">Patient Information</h3>
            <p>Age: {image.patientDemographics.age}</p>
            <p>Gender: {image.patientDemographics.gender}</p>
            {image.bodyParts.length > 0 && (
              <p>Body Parts: {image.bodyParts.join(", ")}</p>
            )}
            {image.diagnoses.length > 0 && (
              <p>Diagnoses: {image.diagnoses.join(", ")}</p>
            )}
            {image.classifications.length > 0 && (
              <p>Classifications: {image.classifications.join(", ")}</p>
            )}
            {image.implants.length > 0 && (
              <p>Implants: {image.implants.join(", ")}</p>
            )}
            {image.notes && <p>Notes: {image.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
