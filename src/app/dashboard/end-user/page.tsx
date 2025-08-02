
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EndUserDashboardPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Dashboard</CardTitle>
          <CardDescription>Welcome to your HelpDeck dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main dashboard for end-users. Key metrics and quick links will go here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
