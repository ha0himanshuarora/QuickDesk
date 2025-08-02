
"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from "react";


const ticketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  category: z.string().min(1, "Category is required"),
  priority: z.enum(["Low", "Medium", "High"]),
  description: z.string().min(1, "Description is required"),
  attachment: z.any().optional(),
});

type TicketFormValues = z.infer<typeof ticketSchema>;
type Category = { id: string; name: string };

export default function NewTicketPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user, loading: authLoading } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    
    const form = useForm<TicketFormValues>({
        resolver: zodResolver(ticketSchema),
        defaultValues: {
            priority: 'Medium',
        },
    });

    useEffect(() => {
        const q = collection(db, "ticketCategories");
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setCategories(categoriesData);
        });
        return () => unsubscribe();
    }, []);

    const onSubmit = async (data: TicketFormValues) => {
        if (!user) {
            toast({
                title: "Error",
                description: "You must be logged in to create a ticket.",
                variant: "destructive",
            });
            return;
        }

        try {
            let attachmentUrl = "";
            const attachment = data.attachment?.[0];

            if (attachment) {
                const storageRef = ref(storage, `attachments/${user.uid}/${Date.now()}_${attachment.name}`);
                const uploadResult = await uploadBytes(storageRef, attachment);
                attachmentUrl = await getDownloadURL(uploadResult.ref);
            }
            
            await addDoc(collection(db, "tickets"), {
                subject: data.subject,
                category: data.category,
                priority: data.priority,
                description: data.description,
                createdBy: user.email,
                agent: "Unassigned",
                status: "Open",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                comments: [],
                upvotes: 0,
                downvotes: 0,
                ...(attachmentUrl && { attachmentUrl }),
            });
            toast({
                title: "Success",
                description: "Your ticket has been submitted.",
            });
            router.push("/dashboard/end-user/my-tickets");
        } catch (error) {
            console.error("Error creating ticket:", error);
            toast({
                title: "Error",
                description: "Failed to create ticket. Please try again.",
                variant: "destructive",
            });
        }
    };


  return (
    <div>
        <Link href="/dashboard/end-user/my-tickets" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
        </Link>
        <Card className="w-full">
            <CardHeader>
            <CardTitle className="font-headline text-2xl">Create New Ticket</CardTitle>
            <CardDescription>
                Please provide as much detail as possible so we can assist you effectively.
            </CardDescription>
            </CardHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
            <div className="grid gap-6">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Unable to login" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                           </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Priority</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                             </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                 <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                            placeholder="Describe your issue in detail..."
                            className="min-h-[150px]"
                            {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-2">
                <Label htmlFor="attachment" className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                    <Paperclip className="h-4 w-4"/>
                    Attachment (Optional)
                </Label>
                <Input id="attachment" type="file" className="border-dashed" {...form.register("attachment")} />
                </div>
            </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 border-t pt-6">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting || authLoading}>
                    {authLoading ? "Loading..." : form.formState.isSubmitting ? "Submitting..." : "Submit Ticket"}
                </Button>
            </CardFooter>
            </form>
            </Form>
        </Card>
    </div>
  );
}
