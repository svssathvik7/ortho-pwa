import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function AssetUploader() {
  return (
    <div className="m-auto h-fit p-6 flex items-center justify-center w-screen flex-wrap absolute-centre">
      <Card className="">
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
        </CardHeader>
        <CardContent className="w-full flex flex-row gap-4 justify-center">
          <CameraCapture />
          <FileUploader />
        </CardContent>
      </Card>
    </div>
  );
}
