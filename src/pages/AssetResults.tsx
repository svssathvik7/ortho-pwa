import AssetResults from "@/components/assetResults";
import Navbar from "@/components/navbar";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";

export default function AssetDisplay(){
    const location = useLocation();
    const images = location.state?.images;
    return (
        <div className="w-screen h-screen">
            <Navbar/>   
            <div className="h-full w-screen flex items-center justify-around p-2 overflow-y-scroll">
                {images.length==0 ? <Label className="text-3xl">No assets found!</Label> : <AssetResults images={images}/>}
            </div>
        </div>
    )
}