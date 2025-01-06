import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import dicomParser from 'dicom-parser';
import { ZoomIn, ZoomOut, RotateCw, Maximize } from 'lucide-react';

// Define types for our DICOM image data
interface DicomImageProps {
  width: number;
  height: number;
  bitsAllocated: number;
  bitsStored: number;
  highBit: number;
  pixelRepresentation: number;
  windowCenter: number;
  windowWidth: number;
  pixelData: Int16Array | Uint8Array;
  rescaleIntercept: number;
  rescaleSlope: number;
  minPixelValue: number;
  maxPixelValue: number;
}

interface DICOMViewerProps {
  url: string;
  onError?: (error: string) => void;
  className?: string;
}

interface ViewState {
  scale: number;
  rotation: number;
  windowCenter: number;
  windowWidth: number;
}

// Helper functions for pixel data processing
const getMinMax = (
  pixelData: Int16Array | Uint8Array, 
  slope: number, 
  intercept: number
): { min: number; max: number } => {
  let min = Infinity;
  let max = -Infinity;

  // Process data in chunks to avoid stack overflow
  const chunkSize = 1000;
  for (let i = 0; i < pixelData.length; i += chunkSize) {
    const end = Math.min(i + chunkSize, pixelData.length);
    for (let j = i; j < end; j++) {
      const value = pixelData[j] * slope + intercept;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return { min, max };
};

const getDefaultWindow = (min: number, max: number) => {
  const windowWidth = max - min;
  const windowCenter = min + windowWidth / 2;
  return { windowWidth, windowCenter };
};

export default function DICOMViewer({
  url,
  onError,
  className = ''
}: DICOMViewerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dicomImage, setDicomImage] = useState<DicomImageProps | null>(null);
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    rotation: 0,
    windowCenter: 127,
    windowWidth: 256
  });

  // Function to apply windowing to pixel values
  const applyWindowing = useCallback((
    pixelValue: number,
    windowCenter: number,
    windowWidth: number
  ): number => {
    const lower = windowCenter - windowWidth / 2;
    const upper = windowCenter + windowWidth / 2;

    if (pixelValue <= lower) return 0;
    if (pixelValue >= upper) return 255;

    return Math.round(((pixelValue - lower) / windowWidth) * 255);
  }, []);

  // Function to render the image
  const renderImage = useCallback(() => {
    if (!canvasRef.current || !dicomImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate display dimensions
    const displayWidth = Math.floor(dicomImage.width * viewState.scale);
    const displayHeight = Math.floor(dicomImage.height * viewState.scale);
    
    if (displayWidth <= 0 || displayHeight <= 0) return;
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Create temporary canvas for original size image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = dicomImage.width;
    tempCanvas.height = dicomImage.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const imageData = tempCtx.createImageData(dicomImage.width, dicomImage.height);

    // Process pixel data in chunks to avoid stack overflow
    const chunkSize = 1000;
    for (let i = 0; i < dicomImage.pixelData.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, dicomImage.pixelData.length);
      
      for (let j = i; j < end; j++) {
        // Apply rescale slope and intercept
        const pixelValue = dicomImage.pixelData[j] * dicomImage.rescaleSlope + 
                          dicomImage.rescaleIntercept;
        
        // Apply windowing
        const windowedValue = applyWindowing(
          pixelValue,
          viewState.windowCenter,
          viewState.windowWidth
        );
        
        // Set RGB values
        const offset = j * 4;
        imageData.data[offset] = windowedValue;     // R
        imageData.data[offset + 1] = windowedValue; // G
        imageData.data[offset + 2] = windowedValue; // B
        imageData.data[offset + 3] = 255;          // A
      }
    }

    // Draw the processed image
    tempCtx.putImageData(imageData, 0, 0);

    // Apply transformations
    ctx.save();
    ctx.translate(displayWidth / 2, displayHeight / 2);
    ctx.rotate((viewState.rotation * Math.PI) / 180);
    ctx.translate(-displayWidth / 2, -displayHeight / 2);
    
    // Draw the final image
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
      0,
      0,
      displayWidth,
      displayHeight
    );
    
    ctx.restore();
  }, [dicomImage, viewState, applyWindowing]);

  // Load DICOM file
  useEffect(() => {
    const loadDICOM = async () => {
      if (!canvasRef.current) return;
      
      try {
        setLoading(true);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const byteArray = new Uint8Array(arrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);

        // Get image attributes
        const width = dataSet.uint16('x00280011');
        const height = dataSet.uint16('x00280010');
        if (!width || !height) {
          throw new Error('Invalid image dimensions');
        }

        // Get pixel format attributes
        const bitsAllocated = dataSet.uint16('x00280100') ?? 8;
        const bitsStored = dataSet.uint16('x00280101') ?? bitsAllocated;
        const highBit = dataSet.uint16('x00280102') ?? (bitsStored - 1);
        const pixelRepresentation = dataSet.uint16('x00280103') ?? 0;
        
        // Get rescale values
        const rescaleIntercept = dataSet.floatString('x00281052') ?? 0;
        const rescaleSlope = dataSet.floatString('x00281053') ?? 1;

        // Get pixel data
        const pixelDataElement = dataSet.elements.x7fe00010;
        if (!pixelDataElement) {
          throw new Error('No pixel data found');
        }

        // Create appropriate typed array for pixel data
        let pixelData: Int16Array | Uint8Array;
        if (bitsAllocated === 16) {
          pixelData = new Int16Array(
            byteArray.buffer,
            pixelDataElement.dataOffset,
            pixelDataElement.length / 2
          );
        } else {
          pixelData = new Uint8Array(
            byteArray.buffer,
            pixelDataElement.dataOffset,
            pixelDataElement.length
          );
        }

        // Calculate pixel value range
        const { min: minPixelValue, max: maxPixelValue } = getMinMax(
          pixelData,
          rescaleSlope,
          rescaleIntercept
        );

        // Get or calculate window values
        let windowCenter = dataSet.floatString('x00281050');
        let windowWidth = dataSet.floatString('x00281051');

        if (windowCenter === undefined || windowWidth === undefined) {
          const defaultWindow = getDefaultWindow(minPixelValue, maxPixelValue);
          windowCenter = defaultWindow.windowCenter;
          windowWidth = defaultWindow.windowWidth;
        }

        // Create image object
        const imageProps: DicomImageProps = {
          width,
          height,
          bitsAllocated,
          bitsStored,
          highBit,
          pixelRepresentation,
          windowCenter,
          windowWidth,
          pixelData,
          rescaleIntercept,
          rescaleSlope,
          minPixelValue,
          maxPixelValue
        };

        setDicomImage(imageProps);
        setViewState(prev => ({
          ...prev,
          windowCenter,
          windowWidth
        }));

        setLoading(false);
      } catch (err) {
        console.error('Error in DICOM processing:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError('Error loading DICOM file: ' + errorMessage);
        onError?.(errorMessage);
        setLoading(false);
      }
    };

    loadDICOM();
  }, [url, onError]);

  // Update image when view state changes
  useEffect(() => {
    renderImage();
  }, [renderImage]);

  // UI handlers
  // const handleZoomIn = (e: any): void => {
  //   e.stopPropagation();
  //   setViewState(prev => ({
  //     ...prev,
  //     scale: Math.min(5, prev.scale * 1.2)
  //   }));
  // };
  
  // const handleZoomOut = (e: any): void => {
  //   e.stopPropagation();
  //   setViewState(prev => ({
  //     ...prev,
  //     scale: Math.max(0.1, prev.scale / 1.2)
  //   }));
  // };
  
  // const handleRotate = (e: any): void => {
  //   e.stopPropagation();
  //   setViewState(prev => ({
  //     ...prev,
  //     rotation: (prev.rotation + 90) % 360
  //   }));
  // };
  
  // const handleReset = (e: any): void => {
  //   e.stopPropagation();
  //   if (dicomImage) {
  //     setViewState({
  //       scale: 1,
  //       rotation: 0,
  //       windowCenter: dicomImage.windowCenter,
  //       windowWidth: dicomImage.windowWidth
  //     });
  //   }
  // };
  

  if (error) {
    return (
      <Card className="p-4 bg-red-50">
        <div className="text-red-500">
          {error}
          <div className="text-sm mt-2">
            Please check the browser console for detailed error information.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${className}`}>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2" />
              <div className="text-sm text-gray-600">Loading DICOM image...</div>
            </div>
          </div>
        )}
        
            <canvas
              ref={canvasRef}
              className={`${className}`}
              style={{ display: loading ? 'none' : 'block' }}
            />

          {/* {!loading && dicomImage && (
            <div className="flex flex-col gap-4 p-4 border rounded-lg">
              <div className="flex gap-2">
                <Button onClick={handleZoomIn} variant="outline" size="icon">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button onClick={handleZoomOut} variant="outline" size="icon">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button onClick={handleRotate} variant="outline" size="icon">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button onClick={handleReset} variant="outline" size="icon">
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )} */}
        </div>
    </Card>
  );
}