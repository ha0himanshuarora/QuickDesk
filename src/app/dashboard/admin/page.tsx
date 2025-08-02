
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Admin Dashboard</CardTitle>
          <CardDescription>Welcome, Admin! Here you can manage the application.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main dashboard for administrators. Application-wide statistics and quick actions will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
