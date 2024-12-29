import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Download, RefreshCw, Square, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@radix-ui/react-select";
import { BODY_PARTS, CLASSIFICATIONS } from "@/store/constants";  // Make sure these constants are correctly imported.
import { Textarea } from "@/components/ui/textarea";

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors }, control } = useForm();

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaStream(stream);
    } catch (error) {
      console.error("Error accessing webcam", error);
    }
  };

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageDataUrl);
      }
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
  };

  const saveImage = () => {
    if (capturedImage) {
      const a = document.createElement("a");
      a.href = capturedImage;
      a.download = "captured-image.jpg";
      a.click();
    }
  };

  const uploadImage = () => {
    if (capturedImage) {
      setIsUploading(true);
    }
  };

  const onUploadAll = async (data: any) => {
    if (capturedImage) {
      try {
        const formData = new FormData();
        formData.append("image", capturedImage);  // Assuming the captured image is in base64 format
        formData.append("bodyParts", data.bodyParts); // Example of tags
        formData.append("classifications", data.classifications); // Example of tags
        formData.append("notes", data.notes); // Any additional notes

        // Perform your image upload logic here (e.g., API request)
        console.log("Uploading image with tags", data);

        // Example API call
        // await fetch("/upload", {
        //   method: "POST",
        //   body: formData,
        // });

        console.log("Upload successful!");
      } catch (error) {
        console.error("Error uploading image", error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <Card className="w-72 max-w-md mx-auto">
      <CardContent className="p-6">
        {/* Video preview or captured image */}
        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            className={`w-full rounded-lg ${capturedImage ? "hidden" : "block"}`}
          />
          <canvas ref={canvasRef} className="hidden" />
          
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full rounded-lg"
            />
          )}
        </div>

        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          {capturedImage ? (
            <>
              <Button
                onClick={saveImage}
                variant="default"
                className="gap-2 px-2"
              >
                <Download className="w-4 h-4" />
                Save
              </Button>
              <Button
                onClick={uploadImage}
                variant="default"
                className="gap-2 px-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
              <Button
                onClick={resetImage}
                variant="destructive"
                className="gap-2 px-2"
              >
                <RefreshCw className="w-4 h-4" />
                Reset
              </Button>
            </>
          ) : (
            <>
              {!mediaStream ? (
                <Button
                  onClick={startWebcam}
                  variant="default"
                  className="gap-2 px-2"
                >
                  <Camera className="w-4 h-4" />
                  Start Webcam
                </Button>
              ) : (
                <>
                  <Button
                    onClick={captureImage}
                    variant="secondary"
                    className="gap-2 px-2"
                  >
                    <Camera className="w-4 h-4" />
                    Capture
                  </Button>
                  <Button
                    onClick={stopWebcam}
                    variant="destructive"
                    className="gap-2 px-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Upload Form (Tags) */}
        
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
