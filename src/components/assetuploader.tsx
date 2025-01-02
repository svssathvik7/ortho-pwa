import { useEffect, useState } from "react";
import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";

export default function AssetUploader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    setIsOnline(navigator.onLine);
  }, [navigator.onLine]);
  return (
    <div className="m-auto flex-grow p-6 flex items-center justify-center w-screen flex-wrap overflow-y-scroll">
      {isOnline ? (
        <div className="flex gap-2 flex-wrap w-fit">
          <CameraCapture />
          <FileUploader />
        </div>
      ) : (
        <p>Login to upload assets</p>
      )}
    </div>
  );
}
