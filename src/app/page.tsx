
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
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="flex items-center justify-center min-h-screen bg-background">
       <div className="absolute top-4 right-4">
            <ThemeToggle />
       </div>
       <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_500px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div></div>
      <Card className="w-full max-w-sm shadow-2xl">
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
              className="w-12 h-12 text-primary"
            >
              <path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-headline text-center">{isSignUp ? "Create Account" : "HelpDeck"}</CardTitle>
          <CardDescription className="text-center">
            {isSignUp ? "Create an account to get started." : "Sign in to access your support dashboard."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="grid gap-4">
              {firebaseError && (
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{firebaseError}</AlertDescription>
                  </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" {...register("email")} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register("password")} />
                 {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>
              {isSignUp && (
                <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Controller
                        control={control}
                        name="role"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="role">
                                    <SelectValue placeholder="Select your role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="End-User">End-User</SelectItem>
                                    <SelectItem value="Support Agent">Support Agent</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col">
                <Button className="w-full" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </Button>
              <p className="mt-4 text-xs text-center text-muted-foreground">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="underline text-primary">
                  {isSignUp ? "Sign in" : "Sign up"}
                </button>
              </p>
            </CardFooter>
        </form>
      </Card>
    </div>
  )
}
