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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Upload, File } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";

// Define accepted file types and their MIME types
const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/dicom": [".dcm", ".dicom"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Form validation schema
const formSchema = z.object({
  owner: z.string().email("Invalid email"),
  bodyParts: z.array(z.string()).min(1, "Select at least one body part"),
  diagnoses: z.array(z.string()),
  classifications: z.array(z.string()),
  implants: z.array(z.string()),
  patientDemographics: z.object({
    age: z.string().optional(),
    gender: z.string().optional(),
    clinicalHistory: z.string().optional(),
  }),
  notes: z.string(),
});

interface FileWithPreview extends File {
  preview?: string;
  uploadUrl?: string;
}

// Sample options for dropdowns - replace with your actual options
const BODY_PARTS = [
  "Head",
  "Chest",
  "Abdomen",
  "Spine",
  "Upper Extremity",
  "Lower Extremity",
];
const CLASSIFICATIONS = ["X-Ray", "MRI", "CT", "Ultrasound"];

const FileUploader = () => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploading, setUploading] = useState(false);

  const email = useAuthStore((state)=>state.email);

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      owner: email,
      bodyParts: [],
      diagnoses: [],
      classifications: [],
      implants: [],
      patientDemographics: {
        age: "",
        gender: "",
        clinicalHistory: "",
      },
      notes: "",
    },
  });

  const isDICOM = (file: File) => {
    return (
      file?.name?.toLowerCase()?.endsWith(".dcm") ||
      file?.name?.toLowerCase()?.endsWith(".dicom")
    );
  };

  const validateFileType = (file: File) => {
    const fileType = file.type;
    if (isDICOM(file)) return true;
    return Object.keys(ACCEPTED_FILE_TYPES).includes(fileType);
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      if (isDICOM(file)) {
        resolve("/api/placeholder/200/200");
      } else {
        resolve(URL.createObjectURL(file));
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);

    // Validate each file
    for (const file of acceptedFiles) {
      if (!validateFileType(file)) {
        setError(
          "Invalid file type. Please upload only JPEG, PNG, or DICOM files."
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError("File too large. Maximum size is 10MB.");
        return;
      }
    }

    const filesWithPreviews = await Promise.all(
      acceptedFiles.map(async (file) => {
        const preview = await createPreview(file);
        return Object.assign(file, { preview });
      })
    );

    setFiles((prevFiles) => [...prevFiles, ...filesWithPreviews]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
  });

  const removeFile = (fileToRemove: FileWithPreview) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file !== fileToRemove));
    if (fileToRemove.preview && !isDICOM(fileToRemove)) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    setUploadProgress((prev) => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
  };

  const removeAllFiles = () => {
    files.forEach((file) => {
      if (file.preview && !isDICOM(file)) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setFiles([]);
    setUploadProgress({});
  };

  const uploadFile = async (file: FileWithPreview, metadata: any) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Append metadata fields
      Object.entries(metadata).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(`${key}[]`, item));
        } else if (typeof value === "object") {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value as string);
        }
      });

      const response = await api.post("/api/assets/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data.image.cloudinaryUrl;
    } catch (error:any) {
      console.log(error);
      toast(
        {
          title: error.response.data
        }
      )
    }
  };

  const onSubmit = async (formData: z.infer<typeof formSchema>) => {
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
            const uploadUrl = await uploadFile(file, formData);

            setFiles((prevFiles) =>
              prevFiles.map((f) => (f === file ? { ...f, uploadUrl } : f))
            );

            setUploadProgress((prev) => ({
              ...prev,
              [file.name]: 100,
            }));
            toast(
              {
                title: "Uploaded files!"
              }
            );
            return;
          } catch (error:any) {
            setError(`Failed to upload ${file.name}`);
            console.log(error);
            toast(
              {
                title: error.response.data
              }
            )
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
    <Card className="w-72 mx-auto h-fit max-h-72 overflow-y-scroll">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          Upload Medical Images
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300"
                }
                ${uploading ? "pointer-events-none opacity-50" : ""}
              `}
            >
              <input {...getInputProps()} disabled={uploading} />
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">
                {isDragActive
                  ? "Drop files here..."
                  : "Drag & drop medical images here, or click to select"}
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

            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-lg overflow-hidden"
                  >
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

            <FormField
              control={form.control}
              name="bodyParts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Parts</FormLabel>
                  <Select
                    onValueChange={(value: any) =>
                      field.onChange([...field.value, value])
                    }
                    value={field.value[0]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select body parts" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BODY_PARTS.map((part) => (
                        <SelectItem key={part} value={part}>
                          {part}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classifications</FormLabel>
                  <Select
                    onValueChange={(value: any) =>
                      field.onChange([...field.value, value])
                    }
                    value={field.value[0]}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select classifications" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CLASSIFICATIONS.map((classification) => (
                        <SelectItem key={classification} value={classification}>
                          {classification}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any relevant notes about the images"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
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
          onClick={form.handleSubmit(onSubmit)}
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
