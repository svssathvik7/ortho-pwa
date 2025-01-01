type ImageResult = {
    _id: string;
    createdAt: string;
    sharedWith: string[];
    owner: string;
    cloudinaryUrl: string;
    bodyParts: string[];
    diagnoses: string[];
    classifications: string[];
    implants: string[];
    notes: string;
    clinicalHistory: string;
    patientDemographics: {
      age: number;
      gender: string;
    };
  }
  export default ImageResult;