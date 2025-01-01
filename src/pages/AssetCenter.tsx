import React from 'react';
import { useParams } from 'react-router-dom';
import AssetUploader from '@/components/assetuploader';
import AssetGrid from '@/components/displayassets';
import ImageSearch from '@/components/assetSearch';
import Navbar from '@/components/navbar';

export default function AssetCenter() {
  const { type } = useParams();

  const renderComponent = () => {
    switch (type) {
      case 'upload':
        return <AssetUploader />;
      case 'my-assets':
        return <AssetGrid />;
      case 'search':
        return <ImageSearch />;
      default:
        return <div>Invalid asset type.</div>;
    }
  };

  return (
    <div>
      <Navbar/>
      <div className='mt-20'>
        {renderComponent()}   
      </div>
    </div>
  );
}
