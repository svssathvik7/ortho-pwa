import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function AssetUploader() {
  return (
    <div className="m-auto h-fit p-6 flex items-center justify-center w-screen flex-wrap">
      <CameraCapture/>
      <FileUploader/>
    </div>
  );
}
