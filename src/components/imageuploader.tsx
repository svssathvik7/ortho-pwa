import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { 
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Upload, File} from "lucide-react";

// Define accepted file types and their MIME types
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  // DICOM files don't have a standard MIME type, so we check the extension
  'application/dicom': ['.dcm', '.dicom']
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface FileWithPreview extends File {
  preview?: string;
}

const FileUploader = () => {
  // State management for files and errors
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Helper function to check if file is DICOM
  const isDICOM = (file: File) => {
    return file.name.toLowerCase().endsWith('.dcm') || 
           file.name.toLowerCase().endsWith('.dicom');
  };

  // Helper function to validate file type
  const validateFileType = (file: File) => {
    const fileType = file.type;
    if (isDICOM(file)) return true;
    return Object.keys(ACCEPTED_FILE_TYPES).includes(fileType);
  };

  // Create preview for image files
  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (isDICOM(file)) {
        // For DICOM files, we show a placeholder
        resolve('/api/placeholder/200/200');
      } else {
        // For regular images, create object URL
        resolve(URL.createObjectURL(file));
      }
    });
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setUploadProgress(0);

    // Validate each file
    for (const file of acceptedFiles) {
      if (!validateFileType(file)) {
        setError("Invalid file type. Please upload only JPEG, PNG, or DICOM files.");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }
    }

    // Create previews for accepted files
    const filesWithPreviews = await Promise.all(
      acceptedFiles.map(async (file) => {
        const preview = await createPreview(file);
        return Object.assign(file, { preview });
      })
    );

    setFiles((prevFiles) => [...prevFiles, ...filesWithPreviews]);

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true
  });

  // Remove file from list
  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prevFiles) => 
      prevFiles.filter((file) => file !== fileToRemove)
    );
    if (fileToRemove.preview && !isDICOM(fileToRemove)) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
  };

  // Clean up previews when component unmounts
  const removeAllFiles = () => {
    files.forEach((file) => {
      if (file.preview && !isDICOM(file)) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadProgress(0);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Upload Files
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {/* Dropzone area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-2 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">
            {isDragActive
              ? "Drop files here..."
              : "Drag & drop files here, or click to select"}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Accepted files: JPEG, PNG, DICOM (max 10MB)
          </p>
        </div>

        {/* Error message */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload progress */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-gray-500 mt-1">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* File preview */}
        {files.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="relative group rounded-lg overflow-hidden"
                >
                  {/* Preview image */}
                  <div className="aspect-square relative">
                    {isDICOM(file) ? (
                      <div className="flex items-center justify-center w-full h-full bg-gray-100">
                        <File className="w-12 h-12 text-gray-400" />
                      </div>
                    ) : (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* File info overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute inset-0 p-4 text-white">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removeFile(file)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {files.length > 0 && (
        <CardFooter className="flex justify-end space-x-2">
          <Button
            variant="destructive"
            onClick={removeAllFiles}
          >
            Remove All
          </Button>
          <Button
            variant="default"
            onClick={() => {
              // Handle final upload here
              console.log("Uploading files:", files);
            }}
          >
            Upload All
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default FileUploader;