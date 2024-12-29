import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, Download, RefreshCw, Square, Upload } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";

interface PatientDemographics {
  age: string;
  gender: string;
  clinicalHistory: string;
}

const parseTagString = (tagString: string): string[] => {
  return tagString
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);
};

// Main camera capture component
const CameraCapture = () => {
  // Refs for accessing video and canvas elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State management for media stream, captured image, and loading state
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [bodyPartTags, setBodyPartTags] = useState("");
  const [diagnosisTags, setDiagnosisTags] = useState("");
  const [classificationTags, setClassificationTags] = useState("");
  const [implantTags, setImplantTags] = useState("");
  const [notes, setNotes] = useState("");
  const [demographics, setDemographics] = useState<PatientDemographics>({
    age: "",
    gender: "",
    clinicalHistory: "",
  });

  // Get user email from auth store
  const email = useAuthStore((state) => state.email);

  // Start the webcam stream
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaStream(stream);
    } catch (error) {
      console.error("Error accessing webcam", error);
      toast({
        title: "Camera Error",
        description: "Failed to access webcam. Please check permissions.",
      });
    }
  };

  // Stop the webcam stream
  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  // Capture current frame from video
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

  // Convert base64 to File object
  const dataURLtoFile = (dataUrl: string, filename: string): File => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  // Upload the captured image
  const uploadImage = async () => {
    if (!capturedImage) return;

    try {
      setIsUploading(true);
      // Convert base64 image to File object
      const imageFile = dataURLtoFile(capturedImage, "captured-image.jpg");

      // Create FormData and append necessary data
      const formData = new FormData();
      formData.append("file", imageFile);

      const metaData = {
        bodyParts: parseTagString(bodyPartTags),
        diagnoses: parseTagString(diagnosisTags),
        classifications: parseTagString(classificationTags),
        implants: parseTagString(implantTags),
        notes,
        patientDemographics: demographics,
        owner: email,
      };

      formData.append("metadata", JSON.stringify(metaData));
      console.log("FormData content:");
      for (const [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      // Make the upload request
      const response = await api.post("/api/assets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
      stopWebcam();

      // Return the cloudinary URL if needed
      return response.data.image.cloudinaryUrl;
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Reset captured image
  const resetImage = () => {
    setCapturedImage(null);
  };

  // Save captured image locally
  const saveImage = () => {
    if (capturedImage) {
      const a = document.createElement("a");
      a.href = capturedImage;
      a.download = "captured-image.jpg";
      a.click();
    }
  };

  return (
    <Card className="w-96 h-96 mx-auto overflow-y-scroll p-2">
      <CardContent className="p-6">
        {/* Video preview or captured image */}
        <div className="relative mb-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            className={`w-full rounded-lg ${
              capturedImage ? "hidden" : "block"
            }`}
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
        {capturedImage && (
          <div className="space-y-2 m-2">
            <Input
              value={bodyPartTags}
              onChange={(e) => setBodyPartTags(e.target.value)}
              placeholder="Body part tags (separate with spaces)"
            />
            <Input
              value={diagnosisTags}
              onChange={(e) => setDiagnosisTags(e.target.value)}
              placeholder="Diagnosis tags (separate with spaces)"
            />
            <Input
              value={classificationTags}
              onChange={(e) => setClassificationTags(e.target.value)}
              placeholder="Classification tags (separate with spaces)"
            />
            <Input
              value={implantTags}
              onChange={(e) => setImplantTags(e.target.value)}
              placeholder="Implant tags (separate with spaces)"
            />

            {/* Patient Demographics */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={demographics.age}
                onChange={(e) =>
                  setDemographics((prev) => ({ ...prev, age: e.target.value }))
                }
                placeholder="Age"
              />
              <Input
                value={demographics.gender}
                onChange={(e) =>
                  setDemographics((prev) => ({
                    ...prev,
                    gender: e.target.value,
                  }))
                }
                placeholder="Gender"
              />
            </div>
            <Input
              value={demographics.clinicalHistory}
              onChange={(e) =>
                setDemographics((prev) => ({
                  ...prev,
                  clinicalHistory: e.target.value,
                }))
              }
              placeholder="Clinical History"
            />

            {/* Notes */}
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              className="h-24"
            />
          </div>
        )}
        {/* Control buttons */}
        <div className="flex justify-center gap-3">
          {capturedImage ? (
            <>
              <Button
                onClick={saveImage}
                variant="default"
                className="gap-2 px-2"
                disabled={isUploading}
              >
                <Download className="w-4 h-4" />
                Save
              </Button>
              <Button
                onClick={uploadImage}
                variant="default"
                className="gap-2 px-2"
                disabled={isUploading}
              >
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
              <Button
                onClick={resetImage}
                variant="destructive"
                className="gap-2 px-2"
                disabled={isUploading}
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
                  Start Camera
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
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
