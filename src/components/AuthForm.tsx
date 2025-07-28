
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trophy } from 'lucide-react';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isResetPassword) {
        const { error } = await resetPassword(formData.email);
        if (error) throw error;
        toast({
          title: "Password reset email sent",
          description: "Check your email for password reset instructions.",
        });
        setIsResetPassword(false);
      } else if (isSignUp) {
        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;
        toast({
          title: "Account created successfully",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;
        toast({
          title: "Welcome back!",
          description: "You have been signed in successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Trophy className="h-12 w-12 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Castle Douglas Soapbox Derby
          </CardTitle>
          <CardDescription>
            {isResetPassword 
              ? "Reset your password"
              : isSignUp 
                ? "Create your team account"
                : "Sign in to your team account"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>
            
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
            )}
            
            {!isResetPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                />
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full bg-orange-600 hover:bg-orange-700"
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isResetPassword 
                ? "Send Reset Email"
                : isSignUp 
                  ? "Create Account"
                  : "Sign In"
              }
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm">
            {isResetPassword ? (
              <Button
                variant="link"
                onClick={() => setIsResetPassword(false)}
                className="text-orange-600 hover:text-orange-700"
              >
                Back to sign in
              </Button>
            ) : (
              <div className="space-y-2">
                <div>
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                  <Button
                    variant="link"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-orange-600 hover:text-orange-700 ml-1"
                  >
                    {isSignUp ? "Sign in" : "Sign up"}
                  </Button>
                </div>
                
                {!isSignUp && (
                  <Button
                    variant="link"
                    onClick={() => setIsResetPassword(true)}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Forgot your password?
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
