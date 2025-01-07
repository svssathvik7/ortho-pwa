import Navbar from "../components/navbar";
import SigninForm from "../components/signin";
import SignupForm from "../components/signup";
import { useParams } from "react-router-dom";

export default function Auth(){
    const {type} = useParams();
    return (
        <div>
            <Navbar/>
            {type==="login" ? <SigninForm/> : <SignupForm/>}
        </div>
    )
}