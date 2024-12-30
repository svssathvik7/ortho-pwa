import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { useEffect, useState } from "react";

export default function AssetGrid(){
    const email = useAuthStore((state) => state.email);
    const [images, setImages] = useState<any[]>([]);

    useEffect(() => {
      const fetch = async () => {
        try {
          const response = (
            await api.post("/api/assets/search", {
              owner: email,
            })
          ).data;
          setImages(response.data.images);
          console.log(response);
        } catch (error: any) {
          console.log(error);
          toast({
            title: error.response?.data || "An error occurred",
          });
          return;
        }
      };
      fetch();
    }, [email]);
    return (
        <div className="w-screen h-96 mx-auto overflow-y-scroll p-2 flex items-center justify-around">
          {images.length==0 ? <p>No assets to see!</p> : images.map((image) => (
            <div
              key={image._id}
              className="group bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 relative"
            >
              <img
                src={image.cloudinaryUrl}
                alt={image.notes || "Asset Image"}
                className="w-60 aspect-square h-48 object-cover"
              />
              {/* Details shown on hover */}
              <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center p-4">
                <h3 className="text-xl font-semibold text-white">
                  {image.bodyParts.join(", ") || "Unknown Body Part"}
                </h3>
                <p className="text-gray-300 mt-2">
                  {image.classifications.join(", ") || "Unclassified"}
                </p>
                <p className="text-gray-200 mt-2">
                  Notes: {image.notes || "No notes available"}
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Created At: {new Date(image.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
    )
}