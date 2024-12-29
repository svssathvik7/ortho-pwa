type ImageResult = {
    cloudinaryUrl: string;
    bodyParts: string[];
    diagnoses: string[];
    classifications: string[];
    implants: string[];
    notes: string;
    patientDemographics: {
      age: number;
      gender: string;
    };
  }
  export default ImageResult;