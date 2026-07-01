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
import { Check, Plus, Settings, Sunrise, Sun, Moon, Clock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function getIcon(iconName: string) {
  const IconComponent = (Icons as any)[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5" /> : <Icons.Circle className="w-5 h-5" />;
}

const TIME_GROUPS = [
  {
    key: "morning" as const,
    label: "Morning",
    Icon: Sunrise,
    color: "text-amber-600",
    headerBg: "bg-amber-50 border-amber-200",
    accent: "#f59e0b",
  },
  {
    key: "afternoon" as const,
    label: "Afternoon",
    Icon: Sun,
    color: "text-orange-600",
    headerBg: "bg-orange-50 border-orange-200",
    accent: "#f97316",
  },
  {
    key: "evening" as const,
    label: "Evening",
    Icon: Moon,
    color: "text-indigo-600",
    headerBg: "bg-indigo-50 border-indigo-200",
    accent: "#6366f1",
  },
  {
    key: null as null,
    label: "Anytime",
    Icon: Clock,
    color: "text-slate-500",
    headerBg: "bg-slate-50 border-slate-200",
    accent: "#94a3b8",
  },
] as const;

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
      <div className="p-4 md:p-6 space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <Skeleton className="w-36 h-7 mb-3 rounded-lg" />
            <div className="flex gap-4 overflow-x-auto pb-2">
              {[1, 2, 3].map(j => (
                <Skeleton key={j} className="w-56 shrink-0 h-40 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
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

  const anyChoreHasTime = checklists.some(list =>
    list.chores.some(item => item.chore.timeOfDay)
  );

  // Build sections: only include groups that have at least one chore
  const sections = TIME_GROUPS.map(group => {
    const memberLanes = checklists.map(list => ({
      member: list.member,
      chores: list.chores.filter(item =>
        group.key === null
          ? !item.chore.timeOfDay
          : item.chore.timeOfDay === group.key
      ),
    })).filter(lane => lane.chores.length > 0);

    return { ...group, memberLanes };
  }).filter(s => s.memberLanes.length > 0);

  // If no chores have a time of day, show all-in-one flat layout (original view)
  if (!anyChoreHasTime) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Today's Chores</h1>
          <p className="text-muted-foreground text-sm">Check off tasks to earn your allowance!</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-6">
          {checklists.map(list => {
            const completedCount = list.chores.filter(c => c.completionId !== null).length;
            const total = list.chores.length;
            const progress = total > 0 ? (completedCount / total) * 100 : 0;
            const isAllDone = total > 0 && completedCount === total;

            return (
              <MemberCard
                key={list.member.id}
                member={list.member}
                chores={list.chores}
                completedCount={completedCount}
                total={total}
                progress={progress}
                isAllDone={isAllDone}
                onToggle={handleToggle}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Time-of-day swim lane layout
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-1">
        <h1 className="text-2xl font-bold tracking-tight">Today's Chores</h1>
        <p className="text-muted-foreground text-sm">Check off tasks to earn your allowance!</p>
      </div>

      {sections.map(section => {
        const SectionIcon = section.Icon;
        const totalInSection = section.memberLanes.reduce((sum, l) => sum + l.chores.length, 0);
        const doneInSection = section.memberLanes.reduce(
          (sum, l) => sum + l.chores.filter(c => c.completionId !== null).length, 0
        );

        return (
          <div key={String(section.key)}>
            {/* Section header */}
            <div className={`flex items-center justify-between px-3 py-2 rounded-xl border mb-3 ${section.headerBg}`}>
              <div className="flex items-center gap-2">
                <SectionIcon className={`w-4 h-4 ${section.color}`} />
                <span className={`font-bold text-sm uppercase tracking-wider ${section.color}`}>
                  {section.label}
                </span>
              </div>
              <span className={`text-xs font-semibold ${section.color}`}>
                {doneInSection} / {totalInSection} done
              </span>
            </div>

            {/* Horizontally-scrolling member cards within this time group */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {section.memberLanes.map(({ member, chores }) => {
                const completedCount = chores.filter(c => c.completionId !== null).length;
                const total = chores.length;
                const progress = total > 0 ? (completedCount / total) * 100 : 0;
                const isAllDone = total > 0 && completedCount === total;

                return (
                  <MemberCard
                    key={member.id}
                    member={member}
                    chores={chores}
                    completedCount={completedCount}
                    total={total}
                    progress={progress}
                    isAllDone={isAllDone}
                    onToggle={handleToggle}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MemberCard({
  member,
  chores,
  completedCount,
  total,
  progress,
  isAllDone,
  onToggle,
}: {
  member: { id: number; name: string; avatarColor: string };
  chores: { chore: any; completionId: number | null; completedAt: string | null }[];
  completedCount: number;
  total: number;
  progress: number;
  isAllDone: boolean;
  onToggle: (choreId: number, memberId: number, completionId: number | null) => void;
}) {
  return (
    <div className="w-64 shrink-0 rounded-2xl border bg-card shadow-sm flex flex-col">
      {/* Progress bar */}
      <div className="h-1.5 w-full bg-primary/10 rounded-t-2xl overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: member.avatarColor }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Header */}
      <div
        className="px-3 py-2.5 border-b"
        style={{ backgroundColor: `${member.avatarColor}18` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0"
            style={{ backgroundColor: member.avatarColor }}
          >
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{member.name}</p>
            <p className="text-xs font-semibold" style={{ color: member.avatarColor }}>
              {completedCount} / {total} done
            </p>
          </div>
        </div>
      </div>

      {/* Chore list */}
      <div className="p-2.5 space-y-1.5 overflow-y-auto" style={{ maxHeight: "50vh" }}>
        {total === 0 ? (
          <p className="text-center text-muted-foreground text-xs py-4">No chores here</p>
        ) : (
          chores.map(item => {
            const isDone = item.completionId !== null;
            return (
              <button
                key={item.chore.id}
                onClick={() => onToggle(item.chore.id, member.id, item.completionId)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center gap-2.5 ${
                  isDone
                    ? "bg-muted/40 border-muted-foreground/20"
                    : "bg-white border-border hover:border-primary/40 hover:shadow-sm"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : getIcon(item.chore.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-xs truncate ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {item.chore.name}
                  </p>
                  <p className="text-xs font-bold text-primary">
                    ${typeof item.chore.dollarValue === "number"
                      ? item.chore.dollarValue.toFixed(2)
                      : parseFloat(String(item.chore.dollarValue)).toFixed(2)}
                  </p>
                </div>
              </button>
            );
          })
        )}

        {isAllDone && (
          <div className="mt-1 p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-center">
            <p className="font-bold text-primary text-xs">All done!</p>
          </div>
        )}
      </div>
    </div>
  );
}
