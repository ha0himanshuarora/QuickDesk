
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SupportAgentDashboardPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Support Agent Dashboard</CardTitle>
        <CardDescription>Welcome! Here you can manage and resolve tickets.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Support Agent-specific content will go here.</p>
      </CardContent>
    </Card>
  );
}
