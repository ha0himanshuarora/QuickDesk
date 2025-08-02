import { Badge } from "@/components/ui/badge";
import type { Ticket } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type TicketStatus = Ticket['status'];

const statusStyles: Record<TicketStatus, string> = {
  "Open": "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800",
  "Resolved": "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800",
  "Closed": "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

export function TicketStatusBadge({ status, className }: { status: TicketStatus, className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", statusStyles[status], className)}>
      {status}
    </Badge>
  );
}
