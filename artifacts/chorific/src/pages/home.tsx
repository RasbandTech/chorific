import {
  useGetChecklist,
  getGetChecklistQueryKey,
  useCompleteChore,
  useUncompleteChore,
  getGetSummaryQueryKey,
  getGetBalancesQueryKey,
  getGetHistoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import * as Icons from "lucide-react";
import { Check, Plus, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function getIcon(iconName: string) {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5" /> : <Icons.Circle className="w-5 h-5" />;
}

export default function Home() {
  const { data: checklists, isLoading } = useGetChecklist();
  const completeChore = useCompleteChore();
  const uncompleteChore = useUncompleteChore();
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetChecklistQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
  };

  const handleToggle = (choreId: number, memberId: number, completionId: number | null) => {
    if (completionId) {
      uncompleteChore.mutate({ id: completionId }, { onSuccess: invalidate });
    } else {
      completeChore.mutate({ data: { choreId, memberId } }, { onSuccess: invalidate });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="w-48 h-8 mb-6 rounded-lg" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-72 shrink-0 h-96 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!checklists || checklists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] p-4 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Settings className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Chorific!</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          Head over to the Manage tab to add family members and create chores.
        </p>
        <Link href="/manage">
          <Button size="lg" className="rounded-full shadow-md font-bold px-8">
            <Plus className="w-5 h-5 mr-2" />
            Set Up Household
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Today's Chores</h1>
        <p className="text-muted-foreground text-sm">Check off tasks to earn your allowance!</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6">
        {checklists.map((list) => {
          const completedCount = list.chores.filter(c => c.completionId !== null).length;
          const total = list.chores.length;
          const progress = total > 0 ? (completedCount / total) * 100 : 0;
          const isAllDone = total > 0 && completedCount === total;

          return (
            <div
              key={list.member.id}
              className="w-72 shrink-0 rounded-2xl border bg-card shadow-sm flex flex-col"
            >
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-primary/10 rounded-t-2xl overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: list.member.avatarColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              {/* Header */}
              <div
                className="px-4 py-3 border-b"
                style={{ backgroundColor: `${list.member.avatarColor}18` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shrink-0"
                    style={{ backgroundColor: list.member.avatarColor }}
                  >
                    {list.member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-base leading-tight">{list.member.name}</p>
                    <p className="text-xs font-semibold" style={{ color: list.member.avatarColor }}>
                      {completedCount} / {total} done
                    </p>
                  </div>
                </div>
              </div>

              {/* Chore list — plain scrollable div, no Radix */}
              <div className="p-3 space-y-2 overflow-y-auto" style={{ maxHeight: "60vh" }}>
                {total === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">No chores today!</p>
                ) : (
                  list.chores.map((item) => {
                    const isDone = item.completionId !== null;
                    return (
                      <button
                        key={item.chore.id}
                        onClick={() => handleToggle(item.chore.id, list.member.id, item.completionId)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                          isDone
                            ? "bg-muted/40 border-muted-foreground/20"
                            : "bg-white border-border hover:border-primary/40 hover:shadow-sm"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isDone ? <Check className="w-4 h-4" /> : getIcon(item.chore.icon)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {item.chore.name}
                          </p>
                          <p className="text-xs font-bold text-primary">
                            ${typeof item.chore.dollarValue === "number" ? item.chore.dollarValue.toFixed(2) : parseFloat(String(item.chore.dollarValue)).toFixed(2)}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}

                {isAllDone && (
                  <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-xl text-center">
                    <p className="font-bold text-primary text-sm">All done for today!</p>
                    <p className="text-xs text-primary/70 mt-0.5">Great job earning that allowance.</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
