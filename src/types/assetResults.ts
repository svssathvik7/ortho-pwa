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
    patientDemographics: {
      age: number;
      notes: string;
      gender: string;
      clinicalHistory: string;
    };
  }
  export default ImageResult;