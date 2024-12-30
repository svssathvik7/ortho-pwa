import { useAuthStore } from "@/store/authStore";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
export default function Navbar() {
    const isAuthenticated = useAuthStore((state)=>state.isAuthenticated);
    const logout = useAuthStore((state)=>state.logout);
    
    const handleLogout = async()=>{
        try {
            await axios.post(`${backendUrl}/api/auth/logout`);
            logout();
            // Redirect to login page or update UI state
            toast(
                {
                    title: "Successfully logged out!"
                }
            );
            return;
          } catch (error:any) {
            console.error('Logout failed:', error);
            toast(
                {
                    title: "Failed to logged out!",
                }
            );
            return;
          }
    }
    return (
        <div className="flex items-center justify-around fixed z-50 w-screen bg-white left-0 top-0 p-4">
            <Link to={"/"}>OrthoPWA</Link>
            <nav className="gap-4 w-1/3 flex items-center justify-around">
                <Link to="/">Home</Link>
                <Link to="/asset/upload">Asset Manager</Link>
            </nav>
            {isAuthenticated ? (
                <Button className="px-4" onClick={handleLogout}>
                    Logout
                </Button>
            ) : (
                <Button>
                    <Link to="/auth/login" className="px-4">
                        Login
                    </Link>
                </Button>
            )}
        </div>
    );
}
