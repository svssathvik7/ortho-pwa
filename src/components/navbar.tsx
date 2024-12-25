import { Button } from "./ui/button";

export default function Navbar(){
    return (
        <div className="flex items-center justify-around">
            <p>OrthoPWA</p>
            <nav className="gap-4 flex items-center justify-around">
                <a>route1</a>
                <a>route1</a>
                <a>route1</a>
            </nav>
            <Button><a href="/auth">Login</a></Button>
        </div>
    )
}