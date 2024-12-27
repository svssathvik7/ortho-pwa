import { useState, useRef } from "react";

const CameraCapture = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setMediaStream(stream);
    } catch (error) {
      console.error("Error accessing webcam", error);
    }
  };

  const stopWebcam = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });
      setMediaStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageDataUrl = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageDataUrl);
      }
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
  };

  const saveImage = () => {
    if (capturedImage) {
      const a = document.createElement("a");
      a.href = capturedImage;
      a.download = "captured-image.jpg";
      a.click();
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Always render the video element */}
      <video
        ref={videoRef}
        autoPlay
        muted
        className={`w-full rounded-lg ${capturedImage ? "hidden" : "block"}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      {capturedImage ? (
        <>
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full rounded-lg mb-4"
          />
          <div className="flex justify-center gap-4">
            <button
              onClick={saveImage}
              className="bg-green-500 text-white rounded-full px-4 py-2 text-sm shadow-md"
            >
              Save
            </button>
            <button
              onClick={resetImage}
              className="bg-red-500 text-white rounded-full px-4 py-2 text-sm shadow-md"
            >
              Reset
            </button>
          </div>
        </>
      ) : (
        <div className="flex justify-center gap-4">
          {!mediaStream ? (
            <button
              onClick={startWebcam}
              className="bg-blue-500 text-white rounded-full px-4 py-2 text-sm shadow-md"
            >
              Start Webcam
            </button>
          ) : (
            <>
              <button
                onClick={captureImage}
                className="bg-yellow-500 text-black rounded-full px-4 py-2 text-sm shadow-md"
              >
                Capture Image
              </button>
              <button
                onClick={stopWebcam}
                className="bg-red-500 text-white rounded-full px-4 py-2 text-sm shadow-md"
              >
                Stop Camera
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CameraCapture;
