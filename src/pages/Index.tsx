import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useDispatch } from "react-redux";
import { setUser } from "@/store/slices/authSlice";
import { useLoginMutation } from "@/store/slices/apiSlice";

const Index = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [selectedRole, setSelectedRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const userRoles = [
    {
      value: "counsellor",
      label: "Counsellor",
      path: "/counsellor/dashboard",
    },
    {
      value: "mis",
      label: "MIS",
      path: "/mis/dashboard",
    },
  ];

  const clearError = () => {
    if (loginError) {
      setLoginError("");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(""); // Clear previous errors

    if (selectedRole && email && password) {
      try {
        const role = userRoles.find((r) => r.value === selectedRole);
        if (role) {
          const response = await login({
            email,
            password,
            role: selectedRole.toUpperCase(),
          }).unwrap();

          // Save token to localStorage
          localStorage.setItem("token", response.token);
          console.log("Login successful, token:", response.token);

          dispatch(
            setUser({
              id: response.user.user_id,
              name: response.user.name,
              email: response.user.email,
              role: selectedRole,
            })
          );

          // Navigate after setting token and state
          navigate(role.path);
        }
      } catch (err) {
        console.error("Login error:", err);

        // Handle different error structures
        let errorMessage = "Login failed. Please try again.";

        if (err?.data?.error) {
          // RTK Query error structure: { data: { error: "invalid credentials" } }
          errorMessage = err.data.error; // This will show "invalid credentials"
        } else if (err?.message) {
          // Generic error message
          errorMessage = err.message;
        } else if (typeof err === "string") {
          errorMessage = err;
        }

        setLoginError(errorMessage);
        console.error("Error message:", errorMessage);
      }
    } else {
      setLoginError("Please fill all fields.");
    }
  };

  const handleInputChange = (setter) => (e) => {
    setter(e.target.value);
    clearError(); // Clear error when user starts typing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              LNJ Skills Hub
            </h1>
            <p className="text-gray-600">Login to access your dashboard</p>
          </div>

          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Login</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={handleInputChange(setEmail)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={handleInputChange(setPassword)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Select Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => {
                      setSelectedRole(value);
                      clearError();
                    }}
                    required
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your role" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {loginError && (
                  <div
                    className="text-red-500 
                  text-sm p-3 bg-red-50 rounded-md border border-red-200 mb-4"
                  >
                    {loginError}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedRole || !email || !password || isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">🔄</span>
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center rounded-lg bg-indigo-50 px-4 py-2 text-sm text-indigo-800 border border-indigo-200">
              <span className="mr-2">🔐</span>
              Select your role and login to access the platform
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
