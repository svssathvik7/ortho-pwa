import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "../hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../components/ui/hover-card";
import { Dialog, DialogContent, DialogTrigger } from "../components/ui/dialog";
import {
  User,
  Folder,
  Search,
  Upload,
  Home,
  DoorOpen,
  DoorClosed,
  User2,
} from "lucide-react";
import { useState, useEffect } from "react";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export default function Navbar() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logout = useAuthStore((state) => state.logout);
  const [isMobile, setIsMobile] = useState(false);
  const dp = useAuthStore((state) => state.dp); // Get dp directly from the store

  const handleLogout = async () => {
    try {
      await axios.post(`${backendUrl}/api/auth/logout`);
      logout();
      toast({
        title: "Successfully logged out!",
      });
      return;
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Failed to log out!",
      });
      return;
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const AvatarMenu = () =>
    isMobile ? (
      <Dialog>
        <DialogTrigger asChild>
        <Avatar className="cursor-pointer">
            <AvatarImage
              className="w-12 h-12 object-cover"
              src={dp ? dp : "https://github.com/shadcn.png"}
            />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        </DialogTrigger>
        <DialogContent className="w-3/4 rounded-lg">
          <div className="flex flex-col space-y-2">
            {isAuthenticated && <Link
              to="/account"
              className="px-4 py-2 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2 justify-start"
            >
              <User className="w-5 h-5" />
              <span>Account</span>
            </Link>}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-center hover:bg-gray-100 rounded-md transition-colors text-red-600 flex items-center space-x-2 justify-start"
              >
                <DoorOpen className="w-5 h-5" />
                <p>logout</p>
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="px-4 py-2 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-2 justify-start"
              >
                <DoorClosed className="w-5 h-5" />
                <p>login</p>
              </Link>
            )}
          </div>
        </DialogContent>
      </Dialog>
    ) : (
      <HoverCard>
        <HoverCardTrigger asChild>
          <Avatar className="cursor-pointer">
            <AvatarImage
              className="w-12 h-12 object-cover"
              src={dp ? dp : "https://github.com/shadcn.png"}
            />
            <AvatarFallback>
              <User className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
        </HoverCardTrigger>
        <HoverCardContent className="w-32">
          <div className="flex flex-col space-y-2">
            {isAuthenticated && <Link
              to="/account"
              className="px-2 text-center hover:bg-gray-100 rounded-md transition-colors flex items-center justify-start gap-1"
            >
              <User2 className="w-10 h-10 text-black" />
              <span>Account</span>
            </Link>}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="px-2 text-center hover:bg-gray-100 rounded-md transition-colors text-red-600 flex items-center justify-start gap-1"
              >
                <DoorOpen size={15} className="text-red" />
                <span>logout</span>
              </button>
            ) : (
              <Link
                to="/auth/login"
                className="px-2 text-center hover:bg-gray-100 rounded-md transition-colors flex items-center justify-start gap-1"
              >
                <DoorClosed size={15} className="text-black" />
                <span>login</span>
              </Link>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>
    );

  const AssetManagerMenu = () => {
    return isMobile ? (
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center space-x-2">
            <Folder className="w-5 h-5" />
            <span>Asset Manager</span>
          </button>
        </DialogTrigger>
        <DialogContent className="w-3/4 rounded-lg">
          <div className="flex flex-col space-y-2">
            <Link
              to="/assets/upload"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors w-fit"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link
              to="/assets/my-assets"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Folder className="w-4 h-4" />
              <span>My Assets</span>
            </Link>
            <Link
              to="/assets/search"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    ) : (
      <HoverCard>
        <HoverCardTrigger asChild>
          <button className="flex items-center space-x-2">
            <Folder className="w-5 h-5" />
            <span>Asset Manager</span>
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-48">
          <div className="flex flex-col space-y-2">
            <Link
              to="/assets/upload"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Upload</span>
            </Link>
            <Link
              to="/assets/my-assets"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Folder className="w-4 h-4" />
              <span>My Assets</span>
            </Link>
            <Link
              to="/assets/search"
              className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Search className="w-4 h-4" />
              <span>Search</span>
            </Link>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  return (
    <div className="flex items-center justify-around fixed z-50 w-screen bg-transparent p-4 top-0 left-0">
      <Link className="hidden lg:inline-block font-bold" to={"/"}>
        OrthoPWA
      </Link>
      <nav className="flex items-center justify-around space-x-4 gap-4">
        <Link to="/" className="w-fit flex items-center space-x-2">
          <Home className="w-5 h-5"/>
          <span>Home</span>
        </Link>
        <AssetManagerMenu />
      </nav>
      <AvatarMenu />
    </div>
  );
}
