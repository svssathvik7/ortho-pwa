import AssetUploader from "@/components/assetuploader";
import Navbar from "@/components/navbar";
import { useAuthStore } from "@/store/authStore";

export default function Home(){
    const isAuthenticated = useAuthStore((state)=>state.isAuthenticated);
    const email = useAuthStore((state)=>state.email);
    return (
        <div>
            <Navbar/>
            {isAuthenticated ? <h1 className="text-3xl font-bold absolute-centre w-fit h-fit">Welcome {email}</h1> : <h1 className="text-3xl font-bold absolute-centre w-fit h-fit">Welcome to Ortho PWA</h1>}
        </div>
    )
}