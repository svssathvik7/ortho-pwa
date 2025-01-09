import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Alert, AlertDescription } from "../components/ui/alert";
import { X, Upload } from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import api from "../config/axios";
import { toast } from "../hooks/use-toast";
import { useAuthStore } from "../store/authStore";

import DICOMDisplay from "./DICOMDisplay";
import { IsDicom } from "./displayassets";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";

// Define constants for file validation
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/dicom": [".dcm", ".dicom", ".dicm"],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Define interfaces
interface FileWithPreview extends File {
  preview?: string;
  uploadUrl?: string;
}

// Main FileUploader component
const FileUploader = () => {
  // File states
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [notes, setNotes] = useState("");
  const [clinical_history, setClinicalHistory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploading, setUploading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // Metadata states
  const [bodyPartTags, setBodyPartTags] = useState("");
  const [classificationSuggestions, setClassificationSuggestions] = useState(
    []
  );
  const [showPatientInput, setShowPatientInput] = useState(true);
  const [diagnosisTags, setDiagnosisTags] = useState("");
  const [classificationTags, setClassificationTags] = useState("");
  const [implantTags, setImplantTags] = useState("");
  const [demographics, setDemographics] = useState({
    name: "",
    age: "",
    gender: "",
  });

  const handleSavePatient = async (e: any) => {
    e.preventDefault();
    setIsNewUser(true);
    setIsOpen(false);
    setPatientId(email + demographics.name);
    return;
  };

  const [showSuggestions, setShowSuggestions] = useState(false);

  const [patientName, setPatientName] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [formPage, setFormPage] = useState(0);

  useEffect(() => {
    if (patientName) {
      const fetchSuggestions = async () => {
        const response = await api.get(
          `/api/patients/suggestions/${email + patientName}`
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

  const handleSelectSuggestion = async (suggestion: any) => {
    setPatientName(suggestion.name);
    try {
      const response = (
        await api.get(`/api/patients/${email + suggestion.name}`)
      ).data;
      setShowPatientInput(false);
      setDemographics({
        age: response?.patient?.age,
        gender: response?.patient?.gender,
        name: response?.patient?.name,
      });
      setIsNewUser(false);
      setPatientId(response?.patient?.id);
      console.log(response);
    } catch (error) {
      console.log(error);
    } finally {
      setShowSuggestions(false);
    }
  };

  // Convert space-separated tags to arrays
  const parseTagString = (tagString: string): string[] => {
    return tagString
      .trim()
      .split(/\s+/)
      .filter((tag) => tag.length > 0);
  };

  // Validate file type and size
  const validateFile = (file: File) => {
    if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
      setError(
        "Invalid file type. Please upload only JPEG, PNG, or DICOM files."
      );
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 10MB.");
      return false;
    }
    return true;
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    const validFiles = acceptedFiles.filter(validateFile);
    const filesWithPreviews = validFiles.map((file) => {
      const isDicom =
        file.type === "application/dicom" ||
        file.name.endsWith(".dicom") ||
        file.name.endsWith(".dcm");
      const preview = isDicom ? undefined : URL.createObjectURL(file); // No preview for DICOM
      return Object.assign(file, { preview, isDicom });
    });
    setFiles((prev) => [...prev, ...filesWithPreviews]);
  }, []);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  // Remove single file
  const removeFile = useCallback((fileToRemove: FileWithPreview) => {
    setFiles((prev) => prev.filter((file) => file !== fileToRemove));
    if (fileToRemove.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
  }, []);

  // Remove all files
  const removeAllFiles = useCallback(() => {
    files.forEach((file) => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadProgress({});
  }, [files]);

  const email = useAuthStore((state) => state.email);

  // Upload single file with metadata
  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Add metadata to form data
      const metadata = {
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
        owner: email ? email.toLowerCase() : "",
        isNewPatient: isNewUser,
        notes,
        clinical_history,
      };
      console.log(metadata);

      // Append metadata as JSON string
      formData.append("metadata", JSON.stringify(metadata));

      const response = await api.post("/api/assets/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.image.cloudinaryUrl;
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to upload file" });
      throw error;
    }
  };

  // Modified useEffect for classification suggestions
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

  // Upload all files
  const uploadFiles = async () => {
    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        if (!file.uploadUrl) {
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: 0,
          }));

          const progressInterval = setInterval(() => {
            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: Math.min((prev[file.name] || 0) + 10, 90),
            }));
          }, 200);

          try {
            const uploadUrl = await uploadFile(file);
            setFiles((prev) =>
              prev.map((f) => (f === file ? { ...f, uploadUrl } : f))
            );

            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: 100,
            }));

            toast({ title: "File uploaded successfully!" });
          } catch (error) {
            setError(`Failed to upload ${file.name}`);
          } finally {
            clearInterval(progressInterval);
          }
        }
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full lg:max-w-[40dvw] max-w-96 h-max-screen mx-auto overflow-y-scroll p-2">
      <CardContent className="space-y-4 lg:max-w-[40dvw]">
        {formPage == 2 && (
          <div className="flex flex-col items-center justify-start gap-2 h-[40dvh]">
            <div
              {...getRootProps()}
              className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
            ${uploading ? "pointer-events-none opacity-50" : ""}
          `}
            >
              <Input {...getInputProps()} disabled={uploading} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {isDragActive
                  ? "Drop files here..."
                  : "Drag & drop images here, or click to select"}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Accepted files: JPEG, PNG, DICOM (max 10MB)
              </p>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {/* File Preview */}
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden"
                  >
                    <div className="aspect-square relative">
                      {IsDicom(file.name) ? (
                        // Use DICOMDisplay for DICOM files
                        <DICOMDisplay
                          url={file.name || ""}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        // Use <img> for image files
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                      {uploadProgress[file.name] !== undefined &&
                        uploadProgress[file.name] < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
                            <Progress
                              value={uploadProgress[file.name]}
                              className="h-2"
                            />
                            <p className="text-xs text-white mt-1">
                              {uploadProgress[file.name]}%
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute inset-0 p-4 text-white">
                        <p className="text-sm font-medium truncate">
                          {file.name}
                        </p>
                        <p className="text-xs">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        {file.uploadUrl && (
                          <a
                            href={file.uploadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-300 hover:text-blue-200 mt-1 block"
                          >
                            View uploaded file
                          </a>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 px-2"
                        onClick={() => removeFile(file)}
                        disabled={uploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-center">
              <Button
                variant="destructive"
                onClick={removeAllFiles}
                disabled={uploading || files.length === 0}
                className="px-2 mx-1"
              >
                Remove All
              </Button>
              <Button
                variant="default"
                onClick={uploadFiles}
                disabled={uploading || files.length === 0}
                className="px-2 mx-1"
              >
                {uploading ? "Uploading..." : "Upload All"}
              </Button>
            </div>
          </div>
        )}

        {/* Tags and Metadata Inputs */}
        {formPage == 1 && (
          <div className="space-y-2 h-[35dvh]">
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
              {classificationSuggestions.length > 0 && (
                <ul className="z-50 relative w-full mt-1 bg-white text-black border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {classificationSuggestions.map((suggestion: any, index) => (
                    <li
                      key={index}
                      onClick={() => handleClassificationSuggestion(suggestion)}
                      className="p-1 z-50 h-48 overflow-y-scroll cursor-pointer hover:bg-blue-50 transition-colors"
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
          </div>
        )}
        {formPage == 0 && (
          <div className="flex gap-1 flex-col items-center justify-center w-full h-[35dvh]">
            {showPatientInput && <Input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="Enter patient name..."
              className="flex-1 w-full px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300"
            />}
            <Dialog open={isOpen}>
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
              rows={7}
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="w-full flex items-center justify-between m-2 p-2">
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
    </Card>
  );
};

export default FileUploader;
