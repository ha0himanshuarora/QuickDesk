
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, doc, updateDoc, Timestamp, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

type RoleChangeRequest = {
    id: string;
    uid: string;
    userEmail: string;
    currentRole: string;
    requestedRole: string;
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: Timestamp;
}

export default function AdminDashboardPage() {
    const [requests, setRequests] = useState<RoleChangeRequest[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        const q = query(collection(db, "roleChangeRequests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requestsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RoleChangeRequest));
            setRequests(requestsData);
        });
        return () => unsubscribe();
    }, []);

    const handleRequest = async (request: RoleChangeRequest, newStatus: 'approved' | 'rejected') => {
        const requestRef = doc(db, "roleChangeRequests", request.id);
        try {
            if (newStatus === 'approved') {
                const userRef = doc(db, "users", request.uid);
                await updateDoc(userRef, { role: request.requestedRole });
            }
            await updateDoc(requestRef, { status: newStatus });
            
            // To update the profile page of the user in real-time
            const q = query(collection(db, "roleChangeRequests"), where("uid", "==", request.uid), where("status", "==", "pending"));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                const userDocRef = doc(db, "users", request.uid);
                await updateDoc(userDocRef, { hasPendingRequest: false });
            }

            toast({
                title: "Success",
                description: `Request has been ${newStatus}.`,
            });
        } catch (error) {
            console.error("Error processing request:", error);
            toast({
                title: "Error",
                description: "Failed to process request.",
                variant: "destructive",
            });
        }
    };


  return (
    <div className="space-y-6">
        <Card>
        <CardHeader>
            <CardTitle className="font-headline">Admin Dashboard</CardTitle>
            <CardDescription>Welcome, Admin! Here you can manage the application.</CardDescription>
        </CardHeader>
        <CardContent>
            <p>Admin-specific content and overall application stats can go here.</p>
        </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Role Change Requests</CardTitle>
                <CardDescription>Approve or reject role change requests from users.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User Email</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Requested Role</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center">No pending requests.</TableCell>
                            </TableRow>
                        ) : (
                            requests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell>{req.userEmail}</TableCell>
                                    <TableCell><Badge variant="outline">{req.currentRole}</Badge></TableCell>
                                    <TableCell><Badge variant="default">{req.requestedRole}</Badge></TableCell>
                                    <TableCell>{req.requestedAt.toDate().toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => handleRequest(req, 'rejected')}>Reject</Button>
                                        <Button size="sm" onClick={() => handleRequest(req, 'approved')}>Approve</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
