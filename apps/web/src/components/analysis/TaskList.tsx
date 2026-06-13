import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AnalysisTask } from "@/lib/analysisTypes";
import { taskPriorityVariant, taskStatusVariant } from "@/lib/analysisUi";

type TaskListProps = {
  tasks: AnalysisTask[];
  labels: {
    nextSteps: string;
    noTasks: string;
    priorityPrefix: string;
    statusMap?: Record<AnalysisTask["status"], string>;
    priorityMap?: Record<AnalysisTask["priority"], string>;
  };
};

export function TaskList({ tasks, labels }: TaskListProps) {
  if (!tasks.length) {
    return (
      <Card className="border-border/80 p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        <h3 className="text-lg font-semibold">{labels.nextSteps}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{labels.noTasks}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card
          key={task.id}
          className="border-border/80 p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[220px] flex-1">
              <div className="mb-2 inline-block h-1.5 w-1.5 rounded-full bg-primary/70" />
              <h3 className="text-base font-semibold">{task.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={taskPriorityVariant(task.priority)}>
                {labels.priorityPrefix}: {labels.priorityMap?.[task.priority] ?? task.priority}
              </Badge>
              <Badge variant={taskStatusVariant(task.status)}>{labels.statusMap?.[task.status] ?? task.status}</Badge>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
