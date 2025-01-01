import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import api from "@/config/axios";
import { useNavigate } from "react-router-dom";

type AccountData = {
  dp: string;
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function Account() {
  const [formData, setFormData] = useState<AccountData>({
    dp: "",
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const email = useAuthStore((state) => state.email);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const navigate = useNavigate();
  useEffect(()=>{
    if(!isAuthenticated){
      navigate("/auth/login");
      return;
    }
  },[isAuthenticated]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if(!isAuthenticated) {
          return;
        }
        const response = (await api.get(`/api/auth/user/${email}`)).data;
        setFormData((prev) => ({
          ...prev,
          dp: response?.data?.dp || "", // Ensure a valid initial dp
          username: response.data.username,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } catch (error) {
        console.log(error);
        toast({
          title: "Error",
          description: "Failed to load user data",
          variant: "destructive",
        });
      }
    };

    fetchUserData();
  }, [email]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, files } = e.target;

    if (id === "avatar-upload" && files?.[0]) {
      setSelectedFile(files[0]);
      const previewUrl = URL.createObjectURL(files[0]);
      setFormData((prev) => ({ ...prev, dp: previewUrl })); // Set dp to preview URL
    } else {
      setFormData((prev) => ({ ...prev, [id]: value }));
    }
  };

  const validateForm = () => {
    if (
      formData.newPassword &&
      formData.newPassword !== formData.confirmPassword
    ) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return false;
    }

    if (formData.newPassword && !formData.currentPassword) {
      toast({
        title: "Error",
        description: "Current password is required to change password",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };
  const login = useAuthStore((state)=>state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const updatedData = new FormData();
      const metaData = {
        email: email,
        username: formData.username,
      };

      updatedData.append("userData", JSON.stringify(metaData));

      if (selectedFile) {
        updatedData.append("file", selectedFile);
      }

      await api.post("/api/auth/user/update", updatedData);

      toast({
        title: "Success",
        description: "Account settings updated successfully",
      });

      login(email || "email", formData.dp);
      

      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      console.log(error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update account settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-4 mt-24">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Account Settings</h1>

        <Card className="max-w-lg mx-auto p-2">
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-center space-x-4">
                <Avatar className="h-24 w-24">
                  {/* Show the avatar image or a fallback if the image is not loaded */}
                  <AvatarImage src={formData.dp || "/path/to/default-avatar.jpg"} alt="Profile Picture" />
                  <AvatarFallback>
                    <User className="h-12 w-12" />
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-md cursor-pointer hover:bg-primary/90"
                >
                  <Camera className="mr-2 h-4 w-4" /> Change Photo
                </label>
                <Input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleChange}
                />
              </div>

              <Input
                id="username"
                type="text"
                value={formData.username}
                placeholder="Username"
                onChange={handleChange}
                className="w-full"
              />

              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                placeholder="Current Password"
                onChange={handleChange}
                className="w-full"
              />
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                placeholder="New Password"
                onChange={handleChange}
                className="w-full"
              />
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                placeholder="Confirm New Password"
                onChange={handleChange}
                className="w-full"
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
