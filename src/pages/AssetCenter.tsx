import { useNavigate, useParams } from 'react-router-dom';
import AssetUploader from '@/components/assetuploader';
import AssetGrid from '@/components/displayassets';
import ImageSearch from '@/components/assetSearch';
import Navbar from '@/components/navbar';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function AssetCenter() {
  const { type } = useParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const router = useNavigate();

  useEffect(
    ()=>{
      if (!isAuthenticated) {
        toast(
          {
            title: 'You need to be logged in to access this page.'
          }
        );
        router('/auth/login');
        return;
      }
    }
  ,[]);

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
      <div>
        {isAuthenticated && renderComponent()}   
      </div>
    </div>
  );
}
