import { useState } from "react";
import { 
  useGetChecklist, 
  getGetChecklistQueryKey,
  useCompleteChore,
  useUncompleteChore,
  useGetSummary,
  getGetSummaryQueryKey,
  getGetBalancesQueryKey,
  getGetHistoryQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import * as Icons from "lucide-react";
import { Check, Plus, Settings } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: checklists, isLoading } = useGetChecklist();
  const completeChore = useCompleteChore();
  const uncompleteChore = useUncompleteChore();
  const queryClient = useQueryClient();

  const handleToggle = (choreId: number, memberId: number, completionId: number | null) => {
    if (completionId) {
      uncompleteChore.mutate({ id: completionId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChecklistQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        }
      });
    } else {
      completeChore.mutate({ data: { choreId, memberId } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChecklistQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetHistoryQueryKey() });
        }
      });
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Icons.Circle className="w-5 h-5" />;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 h-full flex flex-col">
        <Skeleton className="w-48 h-8 mb-6 rounded-lg" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="w-[280px] shrink-0 h-[60vh] rounded-xl" />
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
          It looks like you haven't set up any family members or chores yet. Head over to the Manage tab to get started.
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
    <div className="h-full flex flex-col p-4 md:p-6 overflow-hidden animate-in fade-in duration-300">
      <div className="mb-6 px-1">
        <h1 className="text-2xl font-bold tracking-tight">Today's Chores</h1>
        <p className="text-muted-foreground text-sm">Check off tasks to earn your allowance!</p>
      </div>

      <ScrollArea className="flex-1 w-full whitespace-nowrap rounded-xl border bg-card/50 shadow-inner">
        <div className="flex h-full w-max space-x-4 p-4">
          {checklists.map((list) => {
            const completedCount = list.chores.filter(c => c.completionId !== null).length;
            const progress = list.chores.length > 0 ? (completedCount / list.chores.length) * 100 : 0;
            const isAllDone = list.chores.length > 0 && completedCount === list.chores.length;

            return (
              <div 
                key={list.member.id} 
                className="w-[280px] sm:w-[320px] shrink-0 flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden"
              >
                {/* Header */}
                <div 
                  className="p-4 border-b relative overflow-hidden"
                  style={{ backgroundColor: `${list.member.avatarColor}15` }}
                >
                  <div className="absolute top-0 left-0 h-1 bg-primary/20 w-full">
                    <motion.div 
                      className="h-full" 
                      style={{ backgroundColor: list.member.avatarColor }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm border-2 border-white/20"
                      style={{ backgroundColor: list.member.avatarColor }}
                    >
                      {list.member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg">{list.member.name}</h2>
                      <p className="text-sm font-medium opacity-80" style={{ color: list.member.avatarColor }}>
                        {completedCount} / {list.chores.length} done
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chores List */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3 pb-4">
                    {list.chores.length === 0 ? (
                      <div className="text-center p-6 text-muted-foreground text-sm">
                        No chores assigned today!
                      </div>
                    ) : (
                      list.chores.map((item) => {
                        const isDone = item.completionId !== null;
                        const isLoading = completeChore.isPending || uncompleteChore.isPending;

                        return (
                          <motion.button
                            key={item.chore.id}
                            layout
                            disabled={isLoading}
                            onClick={() => handleToggle(item.chore.id, list.member.id, item.completionId)}
                            className={`w-full text-left p-4 rounded-xl border transition-all duration-200 relative overflow-hidden group ${
                              isDone 
                                ? 'bg-muted/50 border-muted-foreground/20 shadow-none' 
                                : 'bg-background hover:border-primary/50 hover:shadow-md border-border shadow-sm'
                            }`}
                          >
                            <div className={`flex items-center gap-3 ${isDone ? 'opacity-50' : 'opacity-100'}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isDone ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                              }`}>
                                {isDone ? <Check className="w-5 h-5" /> : getIcon(item.chore.icon)}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-base truncate transition-all ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {item.chore.name}
                                </h3>
                                <div className="text-sm font-bold text-primary">
                                  ${item.chore.dollarValue.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            
                            {/* Done overlay flash */}
                            <AnimatePresence>
                              {isDone && (
                                <motion.div
                                  initial={{ opacity: 1, scale: 1 }}
                                  animate={{ opacity: 0, scale: 1.5 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute inset-0 bg-primary/20 pointer-events-none rounded-xl"
                                />
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })
                    )}
                    
                    {isAllDone && list.chores.length > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-center mt-6"
                      >
                        <span className="font-bold text-primary block mb-1">🎉 All done for today!</span>
                        <span className="text-sm text-primary/80">Great job earning that allowance.</span>
                      </motion.div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
