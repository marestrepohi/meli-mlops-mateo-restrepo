import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const runsData = [
  {
    id: "run_abc123",
    pipeline: "Training Pipeline",
    status: "completed",
    duration: "12m 34s",
    startTime: "2025-01-15 14:30:00",
    accuracy: "94.5%",
  },
  {
    id: "run_def456",
    pipeline: "Data Preprocessing",
    status: "running",
    duration: "5m 12s",
    startTime: "2025-01-15 15:00:00",
    accuracy: "-",
  },
  {
    id: "run_ghi789",
    pipeline: "Model Evaluation",
    status: "failed",
    duration: "2m 45s",
    startTime: "2025-01-15 13:15:00",
    accuracy: "-",
  },
];

const Runs = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Runs</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your pipeline executions
        </p>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Run ID</TableHead>
              <TableHead>Pipeline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>Accuracy</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runsData.map((run) => (
              <TableRow key={run.id} className="hover:bg-muted/50 cursor-pointer">
                <TableCell className="font-mono text-sm">{run.id}</TableCell>
                <TableCell className="font-medium">{run.pipeline}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      run.status === "completed"
                        ? "secondary"
                        : run.status === "running"
                        ? "default"
                        : "destructive"
                    }
                  >
                    {run.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{run.duration}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {run.startTime}
                </TableCell>
                <TableCell className="font-semibold">{run.accuracy}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Runs;
