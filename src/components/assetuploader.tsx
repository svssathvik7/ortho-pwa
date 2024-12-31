import { useEffect, useState } from "react";
import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";

export default function AssetUploader() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    setIsOnline(navigator.onLine);
  }, [navigator.onLine]);
  return (
    <div className="m-auto h-96 p-6 flex items-center justify-center w-screen flex-wrap">
      {isOnline ? (
        <>
          <CameraCapture />
          <FileUploader />
        </>
      ) : (
        <p>Login to upload assets</p>
      )}
    </div>
  );
}
