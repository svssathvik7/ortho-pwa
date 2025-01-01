import React, { useEffect, useState } from 'react';
import api from "@/config/axios";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImageResult from '@/types/assetResults';

const AssetGrid = () => {
  const email = useAuthStore((state) => state.email);
  const [images, setImages] = useState<ImageResult[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageResult | null>(null);
  const [sharingEmail, setSharingEmail] = useState('');
  const [sharingImageId, setSharingImageId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Existing online/offline monitoring code remains the same...
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Existing fetch images effect remains the same...
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await api.get(`/api/assets/get-user-assets/${email}`);
        setImages(response.data.data.images);
      } catch (error: any) {
        if (!navigator.onLine && images.length > 0) {
          return;
        }
        toast({
          title: error.response?.data || "An error occurred",
          variant: "destructive"
        });
      }
    };
    fetchImages();
  }, [email]);

  // Handle sharing access
  const handleShareAccess = async () => {
    if (!sharingEmail.trim() || !sharingImageId) return;
    
    try {
      await api.post(`/api/assets/${sharingImageId}/share`, {
        email: sharingEmail.trim(),
        permission: 'view',
        owner: email
      });
      
      setImages(prevImages => prevImages.map(img => 
        img._id === sharingImageId 
          ? { ...img, sharedWith: [...(img.sharedWith || []), sharingEmail.trim()] }
          : img
      ));
      
      setSharingEmail('');
      toast({ title: "Access granted successfully" });
    } catch (error) {
      toast({
        title: "Failed to grant access",
        variant: "destructive"
      });
    }
  };

  // Handle revoking access
  const handleRevokeAccess = async () => {
    if (!sharingEmail.trim() || !sharingImageId) return;
    
    try {
      await api.post(`/api/assets/${sharingImageId}/revoke`, {
        email: sharingEmail.trim(),
        permission: 'view',
        owner: email
      });
      
      setSharingEmail('');
      toast({ title: "Access revoked successfully" });
    } catch (error) {
      console.log(error);
      toast({
        title: "Failed to revoke access",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="m-auto h-96 p-6 flex items-center justify-center w-screen flex-wrap">
      {!isOnline && (
        <div className="bg-yellow-100 p-2 mb-4 rounded-lg text-yellow-800">
          You're currently offline. Showing cached images.
        </div>
      )}
      <div className="flex-grow w-full flex justify-center flex-wrap gap-1 overflow-y-scroll">
        {images.length === 0 ? (
          <p className="text-center w-full">No assets to see!</p>
        ) : (
          images.map((image) => (
            <div
              key={image._id}
              className="group bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200 relative p-2 w-3/4 lg:min-h-72 lg:w-72"
            >
              <img
                src={image.cloudinaryUrl}
                alt={image.notes || "Asset Image"}
                className="w-full aspect-square object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    {image.bodyParts.join(", ") || "Unknown Body Part"}
                  </h3>
                  <p className="text-gray-300">
                    {image.classifications.join(", ") || "Unclassified"}
                  </p>
                  <p className="text-gray-200">
                    Notes: {image.notes || "No notes available"}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Created At: {new Date(image.createdAt).toLocaleDateString()}
                  </p>
                  {(email !== image.owner) && <p className="text-gray-400 text-sm">Asset by {image.owner}</p>}
                </div>
                {isOnline && <div className="flex justify-end gap-2 mt-4">
                  <Dialog 
                    open={sharingImageId === image._id} 
                    onOpenChange={(isOpen) => { if (!isOpen) setSharingImageId(null); }}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className={`${email !== image?.owner ? "hidden" : "flex"} items-center gap-2 px-2`}
                        onClick={() => {
                          setSelectedImage(image);
                          setSharingImageId(image._id);
                        }}
                        disabled={email !== image?.owner}
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage Access</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="share">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="share">Share Access</TabsTrigger>
                          <TabsTrigger value="revoke">Revoke Access</TabsTrigger>
                        </TabsList>
                        <TabsContent value="share">
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              value={sharingEmail}
                              onChange={(e) => setSharingEmail(e.target.value)}
                              placeholder="Enter email to share"
                              onKeyPress={(e) => e.key === 'Enter' && handleShareAccess()}
                            />
                            <Button onClick={handleShareAccess} className="px-2">
                              Share
                            </Button>
                          </div>
                        </TabsContent>
                        <TabsContent value="revoke">
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              value={sharingEmail}
                              onChange={(e) => setSharingEmail(e.target.value)}
                              placeholder="Enter email to revoke"
                              onKeyPress={(e) => e.key === 'Enter' && handleRevokeAccess()}
                            />
                            <Button 
                              onClick={handleRevokeAccess} 
                              variant="destructive" 
                              className="px-2"
                            >
                              Revoke
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssetGrid;