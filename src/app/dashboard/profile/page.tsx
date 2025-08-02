
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, serverTimestamp, query, where, onSnapshot, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type Role = "End-User" | "Support Agent" | "Admin";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [userData, setUserData] = useState<{ name: string; email: string; role: Role; hasPendingRequest: boolean } | null>(null);
  const [newRole, setNewRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
  });
  
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
                name: data.name || user.displayName || "User",
                email: user.email || "",
                role: data.role,
                hasPendingRequest: data.hasPendingRequest || false,
            });
            form.setValue("name", data.name || user.displayName || "User");
        }
    });

    // Listen for changes on roleChangeRequests
    const q = query(
        collection(db, "roleChangeRequests"),
        where("uid", "==", user.uid)
    );
    const unsubscribeRequests = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
                const changedDoc = change.doc.data();
                if (changedDoc.status === 'rejected') {
                     toast({
                        title: "Request Rejected",
                        description: "Your role change request was rejected by an administrator.",
                        variant: "destructive",
                    });
                }
                 if (changedDoc.status === 'approved') {
                     toast({
                        title: "Request Approved",
                        description: `Your role has been changed to ${changedDoc.requestedRole}.`,
                    });
                }
            }
        });
    });


    return () => {
        unsubscribeUser();
        unsubscribeRequests();
    };

  }, [user, form, toast]);

  const handleRoleChangeRequest = async () => {
    if (!user || !newRole || !userData || newRole === userData?.role) {
      toast({
        title: "No Change",
        description: "You have not selected a new role.",
        variant: "default",
      });
      return;
    }

    if (userData.hasPendingRequest) {
       toast({
        title: "Request Already Pending",
        description: "You already have a role change request pending approval.",
        variant: "default",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "roleChangeRequests"), {
        uid: user.uid,
        userEmail: user.email,
        currentRole: userData.role,
        requestedRole: newRole,
        status: "pending",
        requestedAt: serverTimestamp(),
      });
      
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { hasPendingRequest: true });

      toast({
        title: "Request Submitted",
        description: "Your role change request has been sent to an administrator for approval.",
      });
    } catch (error) {
      console.error("Error submitting role change request:", error);
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setNewRole(null);
    }
  };

  if (authLoading || !userData) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="flex flex-col items-center gap-4">
                <Skeleton className="h-32 w-32 rounded-full" />
                <Skeleton className="h-10 w-32" />
            </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Profile</CardTitle>
        <CardDescription>View and update your profile information.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Name</Label>
            <Input id="name" defaultValue={userData.name} readOnly className="bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus:border-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input id="email" type="email" value={userData.email} readOnly className="bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus:border-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="text-gray-300">Current Role</Label>
            <Input id="role" value={userData.role} readOnly className="bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus:border-white" />
          </div>
        </div>
        <div className="flex flex-col items-center text-center gap-4">
          <Avatar className="w-32 h-32 border-4 border-primary">
            <AvatarImage src={user?.photoURL || "https://placehold.co/128x128.png"} alt={userData.name} data-ai-hint="person face" />
            <AvatarFallback>{userData.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={userData.hasPendingRequest} className="bg-white/90 text-black hover:bg-white">
                    {userData.hasPendingRequest ? "Request Pending" : "Change Role"}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900/80 backdrop-blur-lg text-white border-gray-500/50">
                <AlertDialogHeader>
                <AlertDialogTitle>Request Role Change</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                    Select the role you would like to switch to. An administrator will need to approve this request.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                    <Select onValueChange={(value: Role) => setNewRole(value)}>
                        <SelectTrigger className="bg-transparent border-0 border-b-2 rounded-none focus:ring-0 focus:border-white">
                            <SelectValue placeholder="Select a new role" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900/80 backdrop-blur-lg text-white border-gray-500/50">
                            <SelectItem value="End-User" className="focus:bg-gray-700/50">End-User</SelectItem>
                            <SelectItem value="Support Agent" className="focus:bg-gray-700/50">Support Agent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRoleChangeRequest} disabled={!newRole || isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <p className="text-xs text-gray-300 px-4">Role changes require administrator approval.</p>
        </div>
      </CardContent>
    </Card>
  );
}
