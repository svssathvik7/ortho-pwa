import React, { useState, useEffect } from 'react';
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
import {
  Slider
} from "@/components/ui/slider";
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";

// Interface for our search filters
interface SearchFilters {
  bodyParts: string[];
  diagnoses: string[];
  classifications: string[];
  implants: string[];
  ageRange: [number, number];
  gender: string;
}

// Interface for the search results
interface ImageResult {
  id: string;
  cloudinaryUrl: string;
  metadata: {
    bodyParts: string[];
    diagnoses: string[];
    classifications: string[];
    implants: string[];
    patientDemographics: {
      age: number;
      gender: string;
    };
  };
}

const ImageSearch = () => {
  // State for tag inputs
  const [bodyPartInput, setBodyPartInput] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [classificationInput, setClassificationInput] = useState('');
  const [implantInput, setImplantInput] = useState('');

  // State for selected tags
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<string[]>([]);
  const [selectedImplants, setSelectedImplants] = useState<string[]>([]);

  // State for age range and gender
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 100]);
  const [selectedGender, setSelectedGender] = useState<string>('all');

  // State for search results and loading
  const [searchResults, setSearchResults] = useState<ImageResult[]>([]);
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
      setInput('');
    }
  };

  // Function to handle removing tags
  const handleRemoveTag = (
    tagToRemove: string,
    selectedTags: string[],
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Function to perform the search
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
        gender: selectedGender
      };

      // Make the API call
      const response = await api.post('/api/assets/search', searchFilters);
      setSearchResults(response.data.images);

      toast({
        title: "Search Complete",
        description: `Found ${response.data.images.length} results`
      });

      console.log(response);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render tag input section
  const renderTagInput = (
    placeholder: string,
    inputValue: string,
    setInputValue: React.Dispatch<React.SetStateAction<string>>,
    selectedTags: string[],
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <div className="space-y-2 w-full">
      <div className="flex flex-wrap mb-2">
        {selectedTags.map(tag => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag, selectedTags, setSelectedTags)}
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
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTag(inputValue, selectedTags, setSelectedTags, setInputValue);
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          onClick={() => handleAddTag(inputValue, selectedTags, setSelectedTags, setInputValue)}
          variant="secondary"
          className='px-2'
        >
          Add
        </Button>
      </div>
    </div>
  );

  return (
    <Card className="w-96 h-96 mx-auto overflow-y-scroll p-2 flex items-center justify-start">
      <div className='pt-64 w-full'>
        <CardContent className="p-6 space-y-6 w-full">
          {/* Tag inputs */}
          {renderTagInput(
            "Enter body part...",
            bodyPartInput,
            setBodyPartInput,
            selectedBodyParts,
            setSelectedBodyParts
          )}
          
          {renderTagInput(
            "Enter diagnosis...",
            diagnosisInput,
            setDiagnosisInput,
            selectedDiagnoses,
            setSelectedDiagnoses
          )}
          
          {renderTagInput(
            "Enter classification...",
            classificationInput,
            setClassificationInput,
            selectedClassifications,
            setSelectedClassifications
          )}
          
          {renderTagInput(
            "Enter implant...",
            implantInput,
            setImplantInput,
            selectedImplants,
            setSelectedImplants
          )}

          {/* Age Range Slider */}
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium">Age Range: {ageRange[0]} - {ageRange[1]}</label>
            <Slider
              defaultValue={[0, 100]}
              max={100}
              step={1}
              value={ageRange}
              onValueChange={(value: number[]) => setAgeRange([value[0], value[1]])}
              className="py-4"
            />
          </div>

          {/* Gender Selection */}
          <div className="space-y-2 w-full">
            <label className="text-sm font-medium">Gender</label>
            <Select
              value={selectedGender}
              onValueChange={setSelectedGender}
            >
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

          {/* Results Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {searchResults.map((result) => (
              <Card key={result.id} className="overflow-hidden">
                <img
                  src={result.cloudinaryUrl}
                  alt="Medical image"
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-3">
                  <div className="text-sm space-y-1">
                    <p>Age: {result.metadata.patientDemographics.age}</p>
                    <p>Gender: {result.metadata.patientDemographics.gender}</p>
                    {result.metadata.bodyParts.length > 0 && (
                      <p>Body Parts: {result.metadata.bodyParts.join(', ')}</p>
                    )}
                    {result.metadata.diagnoses.length > 0 && (
                      <p>Diagnoses: {result.metadata.diagnoses.join(', ')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default ImageSearch;