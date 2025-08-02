
"use client";
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; 
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    role: z.enum(["End-User", "Support Agent", "Admin"]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [firebaseError, setFirebaseError] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);

    const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<FormValues>({
        resolver: zodResolver(formSchema)
    });

    const onSubmit = async (data: FormValues) => {
        setFirebaseError(null);
        if (isSignUp && !data.role) {
            setFirebaseError("Please select a role to sign up.");
            return;
        }

        try {
            if (isSignUp) {
                const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
                const user = userCredential.user;
                // Add user to 'users' collection
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,
                    role: data.role,
                });

                toast({
                    title: "Account Created",
                    description: "You have successfully signed up. Please sign in.",
                });
                setIsSignUp(false); // Switch to sign in view
            } else {
                await signInWithEmailAndPassword(auth, data.email, data.password);
                router.push("/dashboard");
            }
        } catch (error: any) {
             const errorCode = error.code;
             if (errorCode === 'auth/configuration-not-found') {
                 setFirebaseError("Firebase Authentication is not configured. Please enable Email/Password sign-in provider in your Firebase project's console.");
             } else {
                 setFirebaseError(error.message);
             }
        }
    };


  return (
    <div className="flex items-center justify-center min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: "url(/Background.jpg)" }}>
      <Card className="w-full max-w-sm bg-black/30 backdrop-blur-lg border border-gray-500/50 rounded-2xl text-white shadow-2xl">
        <CardHeader>
          <div className="flex justify-center mb-4">
             <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-12 h-12 text-white"
            >
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
            </svg>
          </div>
          <CardTitle className="text-3xl font-headline text-center">{isSignUp ? "Create Account" : "HelpDeck Login"}</CardTitle>
          <CardDescription className="text-center text-gray-300">
            {isSignUp ? "Create an account to get started." : "Sign in to access your support dashboard."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-6">
              {firebaseError && (
                  <Alert variant="destructive" className="bg-red-500/20 border-red-500 text-white">
                      <AlertTriangle className="h-4 w-4 !text-white" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{firebaseError}</AlertDescription>
                  </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" {...register("email")} className="bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus:border-white" />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} className="bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus:border-white" />
                 {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>
              {isSignUp && (
                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Controller
                        control={control}
                        name="role"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="role" className="bg-transparent border-0 border-b-2 rounded-none text-white focus:ring-0">
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent className="bg-gray-900/80 backdrop-blur-lg text-white border-gray-500/50">
                                    <SelectItem value="End-User">End-User</SelectItem>
                                    <SelectItem value="Support Agent">Support Agent</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.role && <p className="text-xs text-red-400">{errors.role.message}</p>}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <Button className="w-full bg-white/90 text-black hover:bg-white" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </Button>
              <p className="text-xs text-center text-gray-300">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="underline font-semibold">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  )
}
