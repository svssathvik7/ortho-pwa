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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Progress } from "@/components/ui/progress"; // Import progress bar

const parseTagString = (tagString: string): string[] => {
  return tagString
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);
};

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [patientName, setPatientName] = useState("");
  const [patientData,setPatientData] = useState({
    name: "",
    age: "",
    gender: ""
  });
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track progress
  const [bodyPartTags, setBodyPartTags] = useState("");
  const [diagnosisTags, setDiagnosisTags] = useState("");
  const [classificationTags, setClassificationTags] = useState("");
  const [implantTags, setImplantTags] = useState("");
  const [demographics, setDemographics] = useState({
    age: "",
    gender: "",
    clinical_history: "",
    notes: "",
  });

  const email = useAuthStore((state) => state.email);
  useEffect(() => {
    if (patientName) {
      setPatientData({name:"",age:"",gender:""});
      const fetchSuggestions = async () => {
        const response = await api.get(
          `/api/patients/suggestions/${email+patientName}`
        );
        setPatientSuggestions(response.data.patients || []);
        console.log(response.data.patients);
        setShowSuggestions(true);
      };
      fetchSuggestions();
    } else {
      setShowSuggestions(false);
    }
  }, [patientName]);

  const handleSelectSuggestion = async(suggestion: any) => {
    setPatientName(suggestion.name);
    try {
      const response = (await api.get(`/api/patients/${email+suggestion.name}`)).data;
      setPatientData({
        age: response.patient.age,
        gender: response.patient.gender,
        name: response.patient.name,
      });
      console.log(response.data.patient);
    } catch (error) {
      console.log(error);
    }
    finally{
      setShowSuggestions(false);
    }
  };

  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [_hasPermissions, setHasPermissions] = useState<boolean | null>(null);

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

      console.log("Using constraints:", constraints); // Debug log

      // Request camera access with appropriate constraints
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      console.log("Stream received:", stream.active); // Debug log

      if (videoRef.current) {
        // Ensure video element is ready
        videoRef.current.srcObject = null; // Clear any existing source
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.setAttribute("autoplay", "true");

        // Add event listeners to ensure video is playing
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded"); // Debug log
          videoRef.current
            ?.play()
            .catch((e) => console.error("Play failed:", e));
        };

        videoRef.current.onerror = (e) => {
          console.error("Video error:", e); // Debug log
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

  const uploadImage = async () => {
    if (!capturedImage) return;

    try {
      setIsUploading(true);
      setUploadProgress(0); // Reset progress to 0 at the start

      const imageFile = dataURLtoFile(capturedImage, "captured-image.jpg");

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
        patientDemographics: {
          age: demographics.age.toLowerCase(),
          gender: demographics.gender.toLowerCase(),
          clinicalHistory: demographics.clinical_history.toLowerCase(),
        },
        owner: email ? email.toLowerCase() : "",
      };

      formData.append("metadata", JSON.stringify(metaData));

      // Upload request with progress tracking
      const response = await api.post("/api/assets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress); // Update progress state
          }
        },
      });

      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });

      setUploadProgress(100); // Set to 100% after successful upload
      stopWebcam();
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

  return (
    <Card className="w-full lg:max-w-96 h-max-screen mx-auto overflow-y-scroll p-2">
      <CardContent className="lg:p-6">
        {/* Camera video or captured image */}
        <div className="relative mb-4 aspect-video bg-gray-100 rounded-lg overflow-hidden">
          {!mediaStream && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <Smartphone className="w-12 h-12 mb-2" />
              <p>Camera is not active</p>
              <p>Click "Start Camera" to begin</p>
            </div>
          )}
          {mediaStream && !capturedImage && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
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

        {/* Inputs and Tags */}
        <div className="space-y-2 m-2">
          <div className="space-y-2 w-full">
            <div className="flex flex-wrap mb-2">
              {bodyPartTags != "" &&
                bodyPartTags
                  .split(" ")
                  .map(
                    (tag) =>
                      tag != "" && (
                        <span className="bg-[#facc15] text-black px-2 rounded-full m-1 text-xs">
                          {tag}
                        </span>
                      )
                  )}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={bodyPartTags}
                onChange={(e) => setBodyPartTags(e.target.value)}
                placeholder="Enter body part..."
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2 w-full">
            <div className="flex flex-wrap mb-2">
              {diagnosisTags != "" &&
                diagnosisTags
                  .split(" ")
                  .map(
                    (tag) =>
                      tag != "" && (
                        <span className="bg-[#facc15] text-black px-2 rounded-full m-1 text-xs">
                          {tag}
                        </span>
                      )
                  )}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={diagnosisTags}
                onChange={(e) => setDiagnosisTags(e.target.value)}
                placeholder="Enter diagnoses tags..."
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2 w-full">
            <div className="flex flex-wrap mb-2">
              {classificationTags != "" &&
                classificationTags
                  .split(" ")
                  .map(
                    (tag) =>
                      tag != "" && (
                        <span className="bg-[#facc15] text-black px-2 rounded-full m-1 text-xs">
                          {tag}
                        </span>
                      )
                  )}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={classificationTags}
                onChange={(e) => setClassificationTags(e.target.value)}
                placeholder="Enter classification tags..."
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2 w-full">
            <div className="flex flex-wrap mb-2">
              {implantTags != "" &&
                implantTags
                  .split(" ")
                  .map(
                    (tag) =>
                      tag != "" && (
                        <span className="bg-[#facc15] text-black px-2 rounded-full m-1 text-xs">
                          {tag}
                        </span>
                      )
                  )}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={implantTags}
                onChange={(e) => setImplantTags(e.target.value)}
                placeholder="Enter implant tags..."
                className="flex-1"
              />
            </div>
          </div>
          {/* patient data */}
          <Input
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            placeholder="Enter patient name..."
            className="flex-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
          />
          {showSuggestions && patientSuggestions.length > 0 && (
            <ul className="z-10 mt-1 bg-white border rounded-lg shadow-lg">
              {patientSuggestions.map((suggestion:any, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full cursor-pointer hover:bg-blue-100"
                >
                  {suggestion.name}
                </li>
              ))}
            </ul>
          )}
          {patientData.name != "" && (
            <div>
              <p className="text-black">{patientData?.name}</p>
              <p className="text-black">{patientData?.age}</p>
              <p className="text-black">{patientData?.gender}</p>
            </div>
          )}
          {/* Patient Demographics */}
          {/* <div className="grid grid-cols-2 gap-2">
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
          </div> */}
          <Input
            value={demographics.clinical_history}
            onChange={(e) =>
              setDemographics((prev) => ({
                ...prev,
                clinical_history: e.target.value,
              }))
            }
            placeholder="Clinical History"
          />
          <Input
            value={demographics.notes}
            onChange={(e) =>
              setDemographics((prev) => ({
                ...prev,
                notes: e.target.value,
              }))
            }
            placeholder="Notes"
          />
        </div>

        {/* Progress bar for upload */}
        {isUploading && (
          <div className="mt-4">
            <Progress className="opacity-50" value={uploadProgress} max={100} />
            <p className="text-xs text-black mt-1">{uploadProgress}%</p>
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
