import { useState, useRef, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import {
  Camera,
  Download,
  RefreshCw,
  Square,
  Upload,
  Smartphone,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import api from "../config/axios";
import { toast } from "../hooks/use-toast";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Progress } from "../components/ui/progress"; // Import progress bar
import {
  CAMERA_CONSTRAINTS,
  dataURLtoFile,
  getCameraError,
  parseTagString,
} from "../utils/cameraUtils";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [patientName, setPatientName] = useState("");
  const [patientData, setPatientData] = useState({
    name: "",
    age: "",
    gender: "",
  });
  const [showPatientInput,setShowPatientInput] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // Track progress
  const [bodyPartTags, setBodyPartTags] = useState("");
  const [diagnosisTags, setDiagnosisTags] = useState("");
  const [classificationTags, setClassificationTags] = useState("");
  const [classificationSuggestions, setClassificationSuggestions] = useState(
    []
  );
  const [isOpen, setIsOpen] = useState(false);
  const [implantTags, setImplantTags] = useState("");
  const [demographics, setDemographics] = useState({
    name: "",
    age: "",
    gender: "",
  });

  const email = useAuthStore((state) => state.email);
  useEffect(() => {
    if (patientName) {
      setPatientData({ name: "", age: "", gender: "" });
      const fetchSuggestions = async () => {
        const response = await api.get(
          `/api/patients/suggestions/${email + patientName}`
        );
        setPatientSuggestions(response.data.patients || []);
        if (response.data.patients.length == 0) {
          setIsNewUser(true);
        } else {
          setIsNewUser(false);
        }
        console.log(response.data.patients);
        setShowSuggestions(true);
      };
      fetchSuggestions();
    } else {
      setShowSuggestions(false);
    }
  }, [patientName]);

  const handleSelectSuggestion = async (suggestion: any) => {
    console.log(suggestion);
    setShowPatientInput(false);
    setPatientName(suggestion.name);
    try {
      const response = (
        await api.get(`/api/patients/${email + suggestion.name}`)
      ).data;
      setPatientSuggestions([]);
      setDemographics({
        age: response.patient.age,
        gender: response.patient.gender,
        name: response.patient.name,
      });
      setPatientId(email + response.patient.name);
      setIsNewUser(false);
      console.log(response.data.patient);
    } catch (error) {
      console.log(error);
    } finally {
      setShowSuggestions(false);
    }
  };

  const handleSavePatient = async (e: any) => {
    e.preventDefault();
    setIsNewUser(true);
    setIsOpen(false);
    setPatientId(email + demographics.name);
    return;
  };

  const [clinical_history, setClinicalHistory] = useState("");
  const [notes, setNotes] = useState("");
  const [isMobileDevice, _setIsMobileDevice] = useState(false);
  const [_hasPermissions, setHasPermissions] = useState<boolean | null>(null);

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
    } catch (error:any) {
      console.error("Error accessing webcam:", error);
      // ... (previous error handling remains the same)
      let errorMessage = "Failed to access camera. " + getCameraError(error);
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

  useEffect(() => {
    const fetchClassificationSuggestions = async () => {
      // Only fetch if there's text to search for
      const lastTag = classificationTags.trim().split(/\s+/).pop();
      if (lastTag && lastTag.length > 0) {
        try {
          const response = await api.get(`/api/classifications/${lastTag}`);
          setClassificationSuggestions(response.data.classifications || []);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setClassificationSuggestions([]);
        }
      } else {
        setClassificationSuggestions([]);
      }
    };

    // Debounce the API call to prevent too many requests
    const timeoutId = setTimeout(fetchClassificationSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [classificationTags]);

  const handleClassificationSuggestion = (suggestion: any) => {
    // Get existing tags as an array
    const existingTags = classificationTags
      .trim()
      .split(/\s+/)
      .filter((tag) => tag.length > 0);

    // Remove the partial tag that triggered the suggestion
    existingTags.pop();

    // Add the selected suggestion
    existingTags.push(suggestion.tag);

    // Update the classification tags state
    setClassificationTags(existingTags.join(" ") + " ");

    // Clear suggestions
    setClassificationSuggestions([]);
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
        patientId: patientId,
        bodyParts: parseTagString(bodyPartTags).map((tag) => tag.toLowerCase()),
        diagnoses: parseTagString(diagnosisTags).map((tag) =>
          tag.toLowerCase()
        ),
        classifications: parseTagString(classificationTags).map((tag) =>
          tag.toLowerCase()
        ),
        implants: parseTagString(implantTags).map((tag) => tag.toLowerCase()),
        patientDemographics: {
          name: demographics.name.toLowerCase(),
          age: demographics.age,
          gender: demographics.gender.toLowerCase(),
        },
        clinicalHistory: clinical_history.toLowerCase(),
        notes: notes.toLowerCase(),
        owner: email ? email.toLowerCase() : "",
        isNewPatient: isNewUser,
      };

      formData.append("metadata", JSON.stringify(metaData));
      console.log(formData.get("metadata"));
      // Upload request with progress tracking
      await api.post("/api/assets/upload", formData, {
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

  const [formPage, setFormPage] = useState(0);

  return (
    <Card className="w-full lg:max-w-[40dvw] max-w-96 h-max-screen mx-auto overflow-y-scroll p-2 flex items-center justify-center flex-wrap">
      <CardContent className="lg:p-6 w-full flex items-center justify-center flex-col">
        {/* Camera video or captured image */}
        {formPage == 2 && (
          <div className="relative mb-4 h-[35dvh] aspect-video bg-gray-100 rounded-lg overflow-hidden">
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
            {/* Progress bar for upload */}
            {isUploading && (
              <div className="mt-4">
                <Progress
                  className="opacity-50"
                  value={uploadProgress}
                  max={100}
                />
                <p className="text-xs text-black mt-1">{uploadProgress}%</p>
              </div>
            )}

            {/* Control buttons */}
            <div className="flex justify-center gap-3 items-center absolute bottom-0 mx-auto left-0 right-0 m-1">
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
                      className="gap-2 rounded-full w-10 h-10"
                    >
                      <Camera className="w-8 h-8" />
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
          </div>
        )}

        {/* Inputs and Tags */}
        {formPage == 1 && (
          <div className="space-y-2 m-2 w-full h-[35dvh]">
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap mb-2 w-full">
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
              <div className="flex gap-2 w-full">
                <Input
                  type="text"
                  value={bodyPartTags}
                  onChange={(e) => setBodyPartTags(e.target.value)}
                  placeholder="Enter body part..."
                  className="flex-1 w-full"
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
              {classificationSuggestions.length > 0 && (
                <ul className="z-50 relative w-full mt-1 bg-white text-black border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {classificationSuggestions.map((suggestion: any, index) => (
                    <li
                      key={index}
                      onClick={() => handleClassificationSuggestion(suggestion)}
                      className="p-1 w-full h-48 overflow-y-scroll cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <img
                        className="object-contain h-32"
                        key={index}
                        src={suggestion.url}
                      />
                    </li>
                  ))}
                </ul>
              )}
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
          </div>
        )}
        {formPage == 0 && (
          <div className="flex gap-1 flex-col items-center justify-center w-full h-[35dvh]">
            {showPatientInput && <Input
              value={patientName}
              onChange={(e) => {setPatientName(e.target.value); if(patientName===""){setShowPatientInput(true);}}}
              placeholder="Enter patient name..."
              className="flex-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            />}
            <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
              {showSuggestions &&
                (patientSuggestions.length > 0 ? (
                  <ul className="z-10 mt-1 bg-white border rounded-lg shadow-lg w-full">
                    {patientSuggestions.map((suggestion: any, index) => (
                      <p
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="cursor-pointer text-left p-1"
                      >
                        {suggestion.name}
                      </p>
                    ))}
                  </ul>
                ) : (
                  <DialogTrigger className="w-full">
                    <Button
                      onClick={() => setIsOpen(true)}
                      className="w-full px-2"
                    >
                      Add patient
                    </Button>
                  </DialogTrigger>
                ))}
              <DialogContent>
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                  <DialogTitle>Create a Patient</DialogTitle>
                </div>
                <form onSubmit={handleSavePatient}>
                  <div className="mb-4">
                    <label
                      htmlFor="patientName"
                      className="block text-sm font-medium"
                    >
                      Patient Name
                    </label>
                    <Input
                      id="patientName"
                      type="text"
                      required
                      className="w-full mt-1 p-2 border rounded-md"
                      value={demographics.name}
                      onChange={(e) =>
                        setDemographics((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-4">
                    <Label
                      htmlFor="patientAge"
                      className="block text-sm font-medium"
                    >
                      Age
                    </Label>
                    <Input
                      id="patientAge"
                      type="number"
                      required
                      min={0}
                      className="w-full mt-1 p-2 border rounded-md"
                      value={demographics.age}
                      onChange={(e) =>
                        setDemographics((prev) => ({
                          ...prev,
                          age: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="mb-4">
                    <Label
                      htmlFor="patientGender"
                      className="block text-sm font-medium"
                    >
                      Gender
                    </Label>
                    <select
                      id="patientGender"
                      required
                      className="w-full mt-1 p-2 border rounded-md"
                      value={demographics.gender}
                      onChange={(e) =>
                        setDemographics((prev) => ({
                          ...prev,
                          gender: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
                  >
                    Save
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            {demographics.name != "" && (
              <div className="w-full flex items-center justify-between px-2">
                <p className="text-black">Name: {demographics?.name}</p>
                <p className="text-black">Age: {demographics?.age}</p>
                <p className="text-black">Gender: {demographics?.gender}</p>
              </div>
            )}
            <Input
              value={clinical_history}
              onChange={(e) => setClinicalHistory(e.target.value)}
              placeholder="Clinical History"
            />
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes"
              className="h-fit"
              rows={7}
            />
          </div>
        )}
        <CardFooter className="w-full flex items-center justify-between m-2">
          <Button
            disabled={formPage == 0}
            className="px-2"
            onClick={() => setFormPage(formPage - 1)}
          >
            Prev
          </Button>
          <Button
            disabled={formPage == 2}
            className="px-2"
            onClick={() => setFormPage(formPage + 1)}
          >
            Next
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  );
};

export default CameraCapture;
