import { useState, useRef, useEffect } from "react";
// Remove primereact imports
// import { Button } from "primereact/button";
// import { InputText } from "primereact/inputtext";
// import { Toast } from "primereact/toast"; 

// Add shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming sonner is used elsewhere, or replace with shadcn Toast

import { useState, useRef, useEffect } from "react";
// Remove primereact imports
// import { Button } from "primereact/button";
// import { InputText } from "primereact/inputtext";
// import { Toast } from "primereact/toast"; 

// Add shadcn/ui imports
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner"; // Assuming sonner is used elsewhere, or replace with shadcn Toast

import ZkLogin from "@/lib/zklogin";
import { useSettings } from "@/contexts/settings-context";
import { loginUser, registerUser } from "@/lib/api";


interface AuthFormProps {
  type: "login" | "register";
  onClose: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ type, onClose }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // const toastRef = useRef<Toast>(null); // Remove if using sonner
  // const toastRef = useRef<Toast>(null); // Remove if using sonner
  const { settings, updateSettings, updateZkLoginSettings } = useSettings();
  const [loginType, setLoginType] = useState<"login" | "register">(type);

  // Add useEffect to sync loginType if type prop changes
  useEffect(() => {
    setLoginType(type);
  }, [type]);


  // Add useEffect to sync loginType if type prop changes
  useEffect(() => {
    setLoginType(type);
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      let response;
      if (loginType === "login") {
        response = await loginUser(email, password);
      } else {
        response = await registerUser({ email }, password);
      }
      updateSettings({ accessToken: response.data.access_token, loggedIn: true });
      toast("Success", { description: "Login successful!" }); // Use sonner toast
      toast("Success", { description: "Login successful!" }); // Use sonner toast
      onClose();
    } catch (error: any) {
      console.error("Error during authentication:", error);
      let detail = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.status === 401) {
          detail = "Bad request. Please check your credentials.";
        } else if (error.response.status === 409) {
          detail = "Account already exists";
        }
      }
      toast("Error", { description: detail }); // Use sonner toast
      let detail = "An unexpected error occurred.";
      if (error.response) {
        if (error.response.status === 401) {
          detail = "Bad request. Please check your credentials.";
        } else if (error.response.status === 409) {
          detail = "Account already exists";
        }
      }
      toast("Error", { description: detail }); // Use sonner toast
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOauth = async () => {
    const zkLogin = new ZkLogin();
    await zkLogin.initialize(settings, updateSettings, updateZkLoginSettings);
    zkLogin
      .getURL(settings.zkLogin, updateZkLoginSettings)
      .then(url => {
        window.location.href = url;
      })
      .catch(error => {
        console.error(error);
        toast("Error", { description: "Failed to initiate Google login." });
        toast("Error", { description: "Failed to initiate Google login." });
      });
  };

  return (
    <>
      <h2 className="text-xl font-semibold mb-6 text-center">
        {loginType === "login" ? "Enter your credentials." : "Create Account"}
      </h2>

      <div className="flex flex-col space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            {/* Use shadcn Input */}
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="h-10" // Adjust height as needed
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
             {/* Use shadcn Input */}
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="h-10" // Adjust height as needed
            />
          </div>

          {loginType === "login" && (
            <div className="flex justify-end">
              {/* Style link with text-primary */}
              <Button variant="link" className="text-sm h-auto p-0 text-primary hover:text-primary/90">
                 Forgot password?
              </Button>
            </div>
          )}

           {/* Use shadcn Button */}
          <Button type="submit" disabled={isLoading} className="w-full h-10 bg-[#dc6d4b] hover:bg-[#e07f5f]">
            {isLoading ? "Please wait..." : loginType === "login" ? "Sign In" : "Create Account"}
          </Button>
           {/* Use shadcn Button */}
          <Button type="submit" disabled={isLoading} className="w-full h-10 bg-[#dc6d4b] hover:bg-[#e07f5f]">
            {isLoading ? "Please wait..." : loginType === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>


        {process.env.NEXT_PUBLIC_ENABLE_ZK_LOGIN_GOOGLE === "true" && (
          <Button
            variant="outline"
            className="w-full h-10 flex items-center justify-center gap-2 border-border hover:bg-accent"
            onClick={handleGoogleOauth}
            disabled={isLoading}
            disabled={isLoading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              {/* SVG paths remain the same */}
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
              {/* SVG paths remain the same */}
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z" />
            </svg>
            Continue with Google
            Continue with Google
          </Button>
        )}
      </div>

      <div className="text-center text-sm text-muted-foreground mt-6">
        {loginType === "login" ? (
          <>
          <>
            Don't have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/90" onClick={() => setLoginType("register")}>
              Sign up
            </Button>
          </>
            </Button>
          </>
        ) : (
          <>
          <>
            Already have an account?{" "}
            <Button variant="link" className="p-0 h-auto text-primary hover:text-primary/90" onClick={() => setLoginType("login")}>
              Sign in
            </Button>
          </>
            </Button>
          </>
        )}
      </div>
    </>
    </>
  );
};

export default AuthForm;
