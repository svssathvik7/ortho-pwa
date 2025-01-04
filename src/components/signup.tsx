import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
const backendUrl = import.meta.env.VITE_BACKEND_URL;
const SignupForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async(e:any) => {
    e.preventDefault();
    // Handle form submission logic here
    try {
      const response = (await axios.post(`${backendUrl}/api/auth/register`,formData)).data;
      toast(
        {
          title: "Successfully registered!"
        }
      )
      console.log("At register",response);
      navigate("/auth/login");
      return;
    } catch (error:any) {
      console.log("At login",error);
      const errorText = error?.response?.data?.message??"";
      toast(
        {
          title: "Failed to register!",
          description: errorText
        }
      )
      return;
    }
  };

  const handleChange = (e:any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Card className="w-full max-w-md h-fit mx-auto absolute top-0 left-0 bottom-0 right-0 m-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your details to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              className="w-full"
              required
            />
          </div>
          
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
              <p>Already have an account?</p>
              <Link to='/auth/login' className='px-4 mx-1'><Button className='px-2' type='button'>Login</Button></Link>
          </div>

          <Button type="submit" className="w-full">
            Sign Up
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SignupForm;