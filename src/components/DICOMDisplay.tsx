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

interface DICOMDisplayProps {
  url: string;
  onError?: (error: string) => void;
  className?: string;
}

interface Element {
  dataOffset: number;
  length: number;
  vr?: string;
}

interface DataSet {
  uint16: (tag: string) => number;
  elements: {
    [key: string]: Element;
  };
  byteArray: Uint8Array;
  string: (tag: string) => string;
  intString: (tag: string) => number;
}

const arrayBufferToImage = async (arrayBuffer: ArrayBuffer): Promise<{ dataUrl: string; width: number; height: number }> => {
  try {
    const byteArray = new Uint8Array(arrayBuffer);
    const dataSet = dicomParser.parseDicom(byteArray) as DataSet;

    const pixelDataElement = dataSet.elements['x7fe00010'];
    if (!pixelDataElement) {
      throw new Error('No pixel data found in DICOM file');
    }

    const pixelData = new Uint8Array(
      arrayBuffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length
    );

    const rows = dataSet.uint16('x00280010');
    const columns = dataSet.uint16('x00280011');
    
    if (!rows || !columns) {
      throw new Error('Invalid image dimensions');
    }

    const canvas = document.createElement('canvas');
    canvas.width = columns;
    canvas.height = rows;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const imageData = ctx.createImageData(columns, rows);

    for (let i = 0; i < pixelData.length; i++) {
      const val = pixelData[i];
      imageData.data[i * 4] = val;
      imageData.data[i * 4 + 1] = val;
      imageData.data[i * 4 + 2] = val;
      imageData.data[i * 4 + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return {
      dataUrl: canvas.toDataURL(),
      width: columns,
      height: rows
    };
  } catch (err) {
    throw new Error(`Failed to process DICOM image: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
};

export default function DICOMDisplay({ 
  url, 
  onError, 
  className = ''
}: DICOMDisplayProps): JSX.Element {
  const [imageData, setImageData] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDICOM = async (): Promise<void> => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const { dataUrl, width, height } = await arrayBufferToImage(arrayBuffer);
        setImageData({ url: dataUrl, width, height });
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

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!imageData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      <div className="flex items-center justify-center w-full h-full">
        <img 
          src={imageData.url}
          alt="DICOM medical image"
          className="object-contain"
          style={{
            width: '100%',
            height: 'auto',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
  
}