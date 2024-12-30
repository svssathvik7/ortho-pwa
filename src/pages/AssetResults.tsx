import AssetResults from "@/components/assetResults";
import Navbar from "@/components/navbar";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";

export default function AssetDisplay(){
    const location = useLocation();
    const images = location.state?.images;
    return (
        <div className="h-screen flex flex-col">
            <Navbar/>   
            <div className="flex items-center justify-center flex-grow mt-20">
                {images.length==0 ? <Label className="text-3xl">No assets found!</Label> : <AssetResults images={images}/>}
            </div>
        </div>
    )
}