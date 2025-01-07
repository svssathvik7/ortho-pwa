import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useState } from 'react';
import axios from "axios";
import { toast } from '../hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const SigninForm = () => {
  const login = useAuthStore((state) => state.login);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false); // Track loading state
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true); // Show loader when the request starts

    try {
      const response = (await axios.post(`${backendUrl}/api/auth/login`, formData)).data;
      login(response.data.email, response.data.dp);
      toast({
        title: "Successfully logged in!"
      });
      console.log("At login", response);
      navigate("/");
    } catch (error: any) {
      console.log("At login", error);
      const errorText = error?.response?.data?.message ?? "";
      toast({
        title: "Failed to login!",
        description: errorText
      });
    } finally {
      setLoading(false); // Hide loader when the request completes
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-md h-fit mx-auto absolute top-0 left-0 bottom-0 right-0 m-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your details to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <div className="space-y-2">
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          <div className='w-full h-fit p-2 flex items-center justify-end'>
            <p>Don't have an account?</p>
            <Link to='/auth/register' className='px-4 mx-1'>
              <Button className='px-2' type='button'>Register</Button>
            </Link>
          </div>

          {loading ? (
            <Button type="button" className="w-full" disabled>
              Loading...
            </Button>
          ) : (
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default SigninForm;
