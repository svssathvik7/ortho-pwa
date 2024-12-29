import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";

export default function AssetUploader() {
  return (
    <div className="m-auto h-96 p-6 flex items-center justify-center w-screen flex-wrap">
      <CameraCapture/>
      <FileUploader/>
    </div>
  );
}
