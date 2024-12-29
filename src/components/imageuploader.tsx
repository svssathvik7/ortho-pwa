import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Upload, File } from "lucide-react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

// Define constants for file validation
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Define interfaces
interface FileWithPreview extends File {
  preview?: string;
  uploadUrl?: string;
}

interface PatientDemographics {
  age: string;
  gender: string;
  clinicalHistory: string;
}

// Main FileUploader component
const FileUploader = () => {
  // File states
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploading, setUploading] = useState(false);

  // Metadata states
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
      setError("Invalid file type. Please upload only JPEG or PNG files.");
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
    const filesWithPreviews = validFiles.map((file) =>
      Object.assign(file, { preview: URL.createObjectURL(file) })
    );
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
        bodyParts: parseTagString(bodyPartTags),
        diagnoses: parseTagString(diagnosisTags),
        classifications: parseTagString(classificationTags),
        implants: parseTagString(implantTags),
        notes,
        patientDemographics: demographics,
        owner: email,
      };

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
    <Card className="w-96 h-96 mx-auto overflow-y-scroll p-2">
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
            ${uploading ? "pointer-events-none opacity-50" : ""}
          `}
        >
          <input {...getInputProps()} disabled={uploading} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {isDragActive
              ? "Drop files here..."
              : "Drag & drop images here, or click to select"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Accepted files: JPEG, PNG (max 10MB)
          </p>
        </div>

        {/* Error Message */}
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
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
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
                    <p className="text-sm font-medium truncate">{file.name}</p>
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

        {/* Tags and Metadata Inputs */}
        <div className="space-y-2">
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
                setDemographics((prev) => ({ ...prev, gender: e.target.value }))
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
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="destructive"
          onClick={removeAllFiles}
          disabled={uploading || files.length === 0}
          className="px-2"
        >
          Remove All
        </Button>
        <Button
          variant="default"
          onClick={uploadFiles}
          disabled={uploading || files.length === 0}
          className="px-2"
        >
          {uploading ? "Uploading..." : "Upload All"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FileUploader;
