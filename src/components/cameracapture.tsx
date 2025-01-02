import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Camera,
  Download,
  RefreshCw,
  Square,
  Upload,
  Smartphone,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface PatientDemographics {
  age: string;
  gender: string;
  clinicalHistory: string;
}

// Configuration for different camera environments
const CAMERA_CONSTRAINTS = {
  // Default constraints for desktop
  desktop: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  // Mobile-specific constraints
  mobile: {
    video: {
      facingMode: { ideal: "environment" }, // Prefer back camera
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
};

const parseTagString = (tagString: string): string[] => {
  return tagString
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);
};

const CameraCapture = () => {
  // ... (previous state declarations remain the same)
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
  // Add new state for device type and camera permissions
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null);

  // Detect mobile device on component mount
  useEffect(() => {
    const checkMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent);
      setIsMobileDevice(isMobile);
    };

    checkMobileDevice();
  }, []);

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

  // Check for existing camera permissions
  const checkCameraPermissions = async () => {
    try {
      const permissions = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });
      setHasPermissions(permissions.state === "granted");

      // Listen for permission changes
      permissions.addEventListener("change", () => {
        setHasPermissions(permissions.state === "granted");
      });
    } catch (error) {
      console.warn(
        "Permissions API not supported, falling back to media access check"
      );
      // Fallback for browsers that don't support permissions API
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        stream.getTracks().forEach((track) => track.stop());
        setHasPermissions(true);
      } catch {
        setHasPermissions(false);
      }
    }
  };
  const startWebcam = async () => {
    try {
      // First, check permissions
      await checkCameraPermissions();

      // Select appropriate constraints based on device type
      const constraints = isMobileDevice
        ? CAMERA_CONSTRAINTS.mobile
        : CAMERA_CONSTRAINTS.desktop;

      console.log('Using constraints:', constraints); // Debug log

      // Request camera access with appropriate constraints
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Stream received:', stream.active); // Debug log

      if (videoRef.current) {
        // Ensure video element is ready
        videoRef.current.srcObject = null; // Clear any existing source
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('autoplay', 'true');
        
        // Add event listeners to ensure video is playing
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded'); // Debug log
          videoRef.current?.play().catch(e => console.error('Play failed:', e));
        };

        videoRef.current.onerror = (e) => {
          console.error('Video error:', e); // Debug log
        };
      }

      setMediaStream(stream);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      // ... (previous error handling remains the same)
      let errorMessage = "Failed to access camera. ";

      if (error instanceof DOMException) {
        switch (error.name) {
          case "NotAllowedError":
            errorMessage +=
              "Please grant camera permissions in your browser settings.";
            break;
          case "NotFoundError":
            errorMessage += "No camera device was found.";
            break;
          case "NotReadableError":
            errorMessage += "Camera is already in use by another application.";
            break;
          default:
            errorMessage +=
              "Please check your camera permissions and try again.";
        }
      }

      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);


  // Enhanced stopWebcam function
  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      setMediaStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

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
  const email = useAuthStore((state) => state.email);
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
        bodyParts: parseTagString(bodyPartTags).map((tag) => tag.toLowerCase()),
        diagnoses: parseTagString(diagnosisTags).map((tag) =>
          tag.toLowerCase()
        ),
        classifications: parseTagString(classificationTags).map((tag) =>
          tag.toLowerCase()
        ),
        implants: parseTagString(implantTags).map((tag) => tag.toLowerCase()),
        notes,
        patientDemographics: {
          age: demographics.age.toLowerCase(),
          gender: demographics.gender.toLowerCase(),
          clinicalHistory: demographics.clinicalHistory.toLowerCase(),
        },
        owner: email ? email.toLowerCase() : "",
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

  // Clean up function using useEffect
  useEffect(() => {
    return () => {
      // Ensure camera is stopped when component unmounts
      stopWebcam();
    };
  }, []);

  const saveImage = () => {
    if (capturedImage) {
      const a = document.createElement("a");
      a.href = capturedImage;
      a.download = "captured-image.jpg";
      a.click();
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
  };

  // Modified JSX for better mobile support
  return (
    <Card className="w-full max-w-96 mx-auto overflow-y-scroll p-2">
      <CardContent className="p-6">
      <div className="relative mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {(!mediaStream && !capturedImage) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Smartphone className="w-12 h-12 mb-2" />
              <p>Camera is not active</p>
              <p>Click "Start Camera" to begin</p>
            </div>
          )}
          {(mediaStream && !capturedImage) && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                transform: isMobileDevice ? 'scaleX(-1)' : 'none', // Mirror front camera if needed
              }}
            />
          )}
          <canvas ref={canvasRef} className="hidden" />
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
        </div>

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
              required
            />
            <Select
              value={demographics.gender}
              onValueChange={(value) =>
                setDemographics((prev) => ({ ...prev, gender: value }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
