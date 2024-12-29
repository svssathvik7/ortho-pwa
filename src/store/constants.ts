export const ACCEPTED_FILE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "application/dicom": [".dcm", ".dicom"],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const BODY_PARTS = [
  "Head",
  "Chest",
  "Abdomen",
  "Spine",
  "Upper Extremity",
  "Lower Extremity",
];

export const CLASSIFICATIONS = ["X-Ray", "MRI", "CT", "Ultrasound"];
