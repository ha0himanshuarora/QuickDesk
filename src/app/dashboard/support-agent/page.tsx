
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SupportAgentDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Support Dashboard</CardTitle>
          <CardDescription>Welcome, Support Agent! Here's your overview.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main dashboard for support agents. Key metrics, assigned tickets summary, and quick actions will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
