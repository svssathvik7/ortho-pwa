export const parseTagString = (tagString: string): string[] => {
  return tagString
    .trim()
    .split(/\s+/)
    .filter((tag) => tag.length > 0);
};
export const CAMERA_CONSTRAINTS = {
  // Default constraints for desktop
  desktop: {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
  // Mobile-specific constraints
  mobile: {
    video: {
      facingMode: { ideal: "environment" }, // Prefer back camera
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  },
};

export const dataURLtoFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const getCameraError = (error: DOMException) => {
  if (error instanceof DOMException) {
    let errorMessage = "";
    switch (error.name) {
      case "NotAllowedError":
        errorMessage +=
          "Please grant camera permissions in your browser settings.";
        break;
      case "NotFoundError":
        errorMessage += "No camera device was found.";
        break;
      case "NotReadableError":
        errorMessage += "Camera is already in use by another application.";
        break;
      default:
        errorMessage += "Please check your camera permissions and try again.";
    }
    return errorMessage;
  }
};
