
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
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { collection, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { DataTablePagination } from "@/components/data-table-pagination";

type Category = {
    id: string;
    name: string;
}

export default function CategoryManagementPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [newCategory, setNewCategory] = useState("");
    const { toast } = useToast();
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [loading, setLoading] = useState(true);

    const paginatedCategories = categories.slice((page - 1) * perPage, page * perPage);
    const pageCount = Math.ceil(categories.length / perPage);


    useEffect(() => {
        const q = collection(db, "ticketCategories");
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const categoriesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategories(categoriesData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleAddCategory = async () => {
        if (!newCategory.trim()) {
            toast({ title: "Error", description: "Category name cannot be empty.", variant: "destructive"});
            return;
        }
        try {
            await addDoc(collection(db, "ticketCategories"), { name: newCategory });
            setNewCategory("");
            toast({ title: "Success", description: "Category added successfully." });
        } catch (error) {
            console.error("Error adding category:", error);
            toast({ title: "Error", description: "Failed to add category.", variant: "destructive" });
        }
    };
    
    const handleDeleteCategory = async (categoryId: string) => {
         try {
            await deleteDoc(doc(db, "ticketCategories", categoryId));
            toast({ title: "Success", description: "Category deleted successfully." });
        } catch (error) {
            console.error("Error deleting category:", error);
            toast({ title: "Error", description: "Failed to delete category.", variant: "destructive" });
        }
    };


  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Category Management</CardTitle>
                <CardDescription>Add, remove, and manage ticket categories.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex w-full max-w-sm items-center space-x-2 mb-6">
                    <Input 
                        type="text" 
                        placeholder="New category name"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddCategory}>Add Category</Button>
                </div>

                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Category Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                             <TableRow>
                                <TableCell colSpan={2} className="text-center">Loading categories...</TableCell>
                            </TableRow>
                        ) : categories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">No categories found. Add one above.</TableCell>
                            </TableRow>
                        ) : (
                            paginatedCategories.map(cat => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {pageCount > 0 && (
                    <DataTablePagination 
                        page={page} 
                        pageCount={pageCount} 
                        perPage={perPage} 
                        setPage={setPage} 
                        setPerPage={setPerPage}
                    />
                )}
            </CardContent>
        </Card>
    </div>
  );
}
