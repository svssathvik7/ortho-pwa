import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import ImageResult from "@/types/assetResults";
import { useAuthStore } from "@/store/authStore";
import AssetResults from "./assetResults";

// Interface for our search filters
interface SearchFilters {
  bodyParts: string[];
  diagnoses: string[];
  classifications: string[];
  implants: string[];
  ageRange: [number, number];
  gender: string;
  owner: string;
}

const ImageSearch = () => {
  // State for tag inputs
  const [bodyPartInput, setBodyPartInput] = useState("");
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [classificationInput, setClassificationInput] = useState("");
  const [implantInput, setImplantInput] = useState("");
  const [assetResults,setAssetResults] = useState<ImageResult[]>([]);

  // State for selected tags
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<
    string[]
  >([]);
  const [selectedImplants, setSelectedImplants] = useState<string[]>([]);

  // State for age range and gender
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
  const [selectedGender, setSelectedGender] = useState<string>("all");

  // State for search results and loading
  const [_searchResults, setSearchResults] = useState<ImageResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle adding tags
  const handleAddTag = (
    input: string,
    selectedTags: string[],
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>,
    setInput: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const newTag = input.trim();
    if (newTag && !selectedTags.includes(newTag)) {
      setSelectedTags([...selectedTags, newTag]);
      setInput("");
    }
  };

  // Function to handle removing tags
  const handleRemoveTag = (
    tagToRemove: string,
    selectedTags: string[],
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };
  // Function to perform the search
  const email = useAuthStore((state)=>state.email);
  const handleSearch = async () => {
    try {
      setIsLoading(true);

      // Construct the search filters
      const searchFilters: SearchFilters = {
        bodyParts: selectedBodyParts,
        diagnoses: selectedDiagnoses,
        classifications: selectedClassifications,
        implants: selectedImplants,
        ageRange: ageRange,
        gender: selectedGender,
        owner: email ? email : "NOAUTH"
      };

      // Make the API call
      const response = (await api.post("/api/assets/search", searchFilters))
        .data;
      setSearchResults(response.data.images);

      toast({
        title: "Search Complete",
        description: `Found ${response.data.images.length} results`,
      });
      setAssetResults(response.data.images);
      console.log(response);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "Failed to perform search. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [isOnline,setIsOnline] = useState(navigator.onLine);

  useEffect(
    ()=>{
      setIsOnline(navigator.onLine);
    }
  ,[]);

  return (
    <div className="mt-28 flex items-center justify-center flex-wrap">
      <Card className={`w-screen lg:w-1/4 ${isOnline ? " justify-start " : " justify-center "}`}>
        {isOnline ? <div className="w-full">
          <CardContent className="p-6 space-y-6 w-full">
            {/* Body Part Input */}
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap mb-2">
                {selectedBodyParts.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        handleRemoveTag(
                          tag,
                          selectedBodyParts,
                          setSelectedBodyParts
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 px-2"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={bodyPartInput}
                  onChange={(e) => setBodyPartInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag(
                        bodyPartInput,
                        selectedBodyParts,
                        setSelectedBodyParts,
                        setBodyPartInput
                      );
                    }
                  }}
                  placeholder="Enter body part..."
                  className="flex-1"
                />
                <Button
                  onClick={() =>
                    handleAddTag(
                      bodyPartInput,
                      selectedBodyParts,
                      setSelectedBodyParts,
                      setBodyPartInput
                    )
                  }
                  variant="secondary"
                  className="px-2"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Diagnosis Input */}
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap mb-2">
                {selectedDiagnoses.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-yellow-500 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        handleRemoveTag(
                          tag,
                          selectedDiagnoses,
                          setSelectedDiagnoses
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 px-2"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={diagnosisInput}
                  onChange={(e) => setDiagnosisInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag(
                        diagnosisInput,
                        selectedDiagnoses,
                        setSelectedDiagnoses,
                        setDiagnosisInput
                      );
                    }
                  }}
                  placeholder="Enter diagnosis..."
                  className="flex-1"
                />
                <Button
                  onClick={() =>
                    handleAddTag(
                      diagnosisInput,
                      selectedDiagnoses,
                      setSelectedDiagnoses,
                      setDiagnosisInput
                    )
                  }
                  variant="secondary"
                  className="px-2"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Classification Input */}
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap mb-2">
                {selectedClassifications.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        handleRemoveTag(
                          tag,
                          selectedClassifications,
                          setSelectedClassifications
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 px-2"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={classificationInput}
                  onChange={(e) => setClassificationInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag(
                        classificationInput,
                        selectedClassifications,
                        setSelectedClassifications,
                        setClassificationInput
                      );
                    }
                  }}
                  placeholder="Enter classification..."
                  className="flex-1"
                />
                <Button
                  onClick={() =>
                    handleAddTag(
                      classificationInput,
                      selectedClassifications,
                      setSelectedClassifications,
                      setClassificationInput
                    )
                  }
                  variant="secondary"
                  className="px-2"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Implant Input */}
            <div className="space-y-2 w-full">
              <div className="flex flex-wrap mb-2">
                {selectedImplants.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() =>
                        handleRemoveTag(
                          tag,
                          selectedImplants,
                          setSelectedImplants
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 px-2"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={implantInput}
                  onChange={(e) => setImplantInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleAddTag(
                        implantInput,
                        selectedImplants,
                        setSelectedImplants,
                        setImplantInput
                      );
                    }
                  }}
                  placeholder="Enter implant..."
                  className="flex-1"
                />
                <Button
                  onClick={() =>
                    handleAddTag(
                      implantInput,
                      selectedImplants,
                      setSelectedImplants,
                      setImplantInput
                    )
                  }
                  variant="secondary"
                  className="px-2"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Age Range Slider */}
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">
                Age Range: {ageRange[0]} - {ageRange[1]}
              </label>
              <Slider
                defaultValue={[0, 100]}
                max={100}
                step={1}
                value={ageRange}
                onValueChange={(value: number[]) =>
                  setAgeRange([value[0], value[1]])
                }
                className="py-4"
              />
            </div>

            {/* Gender Selection */}
            <div className="space-y-2 w-full">
              <label className="text-sm font-medium">Gender</label>
              <Select value={selectedGender} onValueChange={setSelectedGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full px-2"
            >
              {isLoading ? "Searching..." : "Search Images"}
            </Button>
          </CardContent>
        </div> : <p>Login to search assets.</p>}
      </Card>
      <div className="w-screen lg:w-3/4">
        {assetResults.length > 0 ? <AssetResults images={assetResults}/> : <p>No assets found!</p>}
      </div>
    </div>
  );
};

export default ImageSearch;
