import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import dicomParser from 'dicom-parser';

// Define our component props interface
interface DICOMDisplayProps {
  url: string;
  onError?: (error: string) => void;
  className?: string;
}

// Define interface for dicom-parser's Element type
interface Element {
  dataOffset: number;
  length: number;
  vr?: string;
}

// Define interface for dicom-parser's DataSet type
interface DataSet {
  uint16: (tag: string) => number;
  elements: {
    [key: string]: Element;
  };
  byteArray: Uint8Array;
  string: (tag: string) => string;
  intString: (tag: string) => number;
}

// Helper function to convert array buffer to image
const arrayBufferToImage = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  try {
    // Parse DICOM data with proper type assertion
    const byteArray = new Uint8Array(arrayBuffer);
    const dataSet = dicomParser.parseDicom(byteArray) as DataSet;

    // Get pixel data - using string key access since the tag is dynamic
    const pixelDataElement = dataSet.elements['x7fe00010'];
    if (!pixelDataElement) {
      throw new Error('No pixel data found in DICOM file');
    }

    // Create a view into the buffer for pixel data
    const pixelData = new Uint8Array(
      arrayBuffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length
    );

    // Get image dimensions
    const rows = dataSet.uint16('x00280010');
    const columns = dataSet.uint16('x00280011');
    
    if (!rows || !columns) {
      throw new Error('Invalid image dimensions');
    }

    // Create canvas and draw image
    const canvas = document.createElement('canvas');
    canvas.width = columns;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.createImageData(columns, rows);

    // Convert pixel data to RGBA
    for (let i = 0; i < pixelData.length; i++) {
      const val = pixelData[i];
      imageData.data[i * 4] = val;     // R
      imageData.data[i * 4 + 1] = val; // G
      imageData.data[i * 4 + 2] = val; // B
      imageData.data[i * 4 + 3] = 255; // A
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  } catch (err) {
    throw new Error(`Failed to process DICOM image: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};

export default function DICOMDisplay({ 
  url, 
  onError, 
  className = ''
}: DICOMDisplayProps): JSX.Element {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadDICOM = async (): Promise<void> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const imageDataUrl = await arrayBufferToImage(arrayBuffer);
        setImageUrl(imageDataUrl);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError('Error loading DICOM file: ' + errorMessage);
        onError?.(errorMessage);
      }
    };

    if (url && url.endsWith('.dcm')) {
      loadDICOM();
    } else {
      const errorMessage = 'Please provide a valid DICOM file URL (.dcm)';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [url, onError]);

  return (
    <Card className={`p-4 w-full max-w-2xl mx-auto ${className}`}>
      {error ? (
        <div className="text-red-500 p-4" role="alert" aria-live="polite">
          {error}
        </div>
      ) : !imageUrl ? (
        <div className="flex items-center justify-center h-64" role="status">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <span className="sr-only">Loading DICOM image...</span>
        </div>
      ) : (
        <div className="relative w-full">
          <img 
            src={imageUrl} 
            alt="DICOM medical image"
            className="w-full h-auto"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>
      )}
    </Card>
  );
}