import { useAuthStore } from "@/store/authStore";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

export default function Navbar() {
    const isAuthenticated = useAuthStore((state)=>state.isAuthenticated);

    return (
        <div className="flex items-center justify-around">
            <p>OrthoPWA</p>
            <nav className="gap-4 flex items-center justify-around">
                <a href="/route1">Route1</a>
                <a href="/route2">Route2</a>
                <a href="/route3">Route3</a>
            </nav>
            {isAuthenticated ? (
                <Button>
                    <a className="px-4" href="#">
                        Logout
                    </a>
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
