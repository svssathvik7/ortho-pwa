import CameraCapture from "./cameracapture";
import FileUploader from "./imageuploader";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function AssetUploader() {
  return (
    <div className="m-auto p-6 flex items-center justify-center w-screen flex-wrap absolute top-0 left-0 right-0 bottom-0">
      <Card className="">
        <CardHeader>
          <CardTitle>Upload files</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          {/* Title and description can be centered in the card */}
          <p className="text-center text-lg">Upload files!</p>
        </CardContent>
        <CardContent className="w-full flex flex-row gap-4 justify-center">
          {/* Flex row layout for components */}
          <CameraCapture />
          <FileUploader />
        </CardContent>
      </Card>
    </div>
  );
}
