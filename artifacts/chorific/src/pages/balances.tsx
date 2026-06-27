import { useGetSummary, getGetSummaryQueryKey, useGetBalances, getGetBalancesQueryKey, useGetMembers, getGetMembersQueryKey, useCreatePayout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trophy, CheckCircle2, TrendingUp, HandCoins, Wallet } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function Balances() {
  const { data: summary, isLoading: isLoadingSummary } = useGetSummary();
  const { data: balances, isLoading: isLoadingBalances } = useGetBalances();
  const { data: members, isLoading: isLoadingMembers } = useGetMembers();
  const createPayout = useCreatePayout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [payingMemberId, setPayingMemberId] = useState<number | null>(null);

  const isLoading = isLoadingSummary || isLoadingBalances || isLoadingMembers;

  const handlePayout = (memberId: number, amount: number) => {
    createPayout.mutate(
      { data: { memberId, amount } },
      {
        onSuccess: () => {
          toast({ title: "Payout successful!", description: `Paid out $${amount.toFixed(2)}.` });
          queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          setPayingMemberId(null);
        },
        onError: () => {
          toast({ title: "Failed to process payout", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">All-time Earned</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${(summary?.totalEarnedAllTime || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/5 border-secondary/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-secondary mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Completed This Week</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {summary?.totalChoresCompletedThisWeek || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-500/5 border-amber-500/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Top Earner</span>
            </div>
            <div className="text-xl font-bold text-foreground truncate">
              {summary?.topEarnerName || "None"}
            </div>
            <div className="text-sm text-muted-foreground">
              ${(summary?.topEarnerBalance || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-500/5 border-red-500/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <HandCoins className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Total Owed</span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              ${(summary?.totalOutstandingBalance || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight px-1">Family Balances</h2>
        
        {(!balances || balances.length === 0) ? (
          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card">
            <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" opacity={0.2} />
            <h3 className="text-lg font-medium text-foreground">No balances yet</h3>
            <p className="text-muted-foreground">Complete some chores to start earning!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {balances.map((b) => (
              <Card key={b.member.id} className="overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  <div className="p-5 flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner"
                      style={{ backgroundColor: b.member.avatarColor }}
                    >
                      {b.member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{b.member.name}</h3>
                      <div className="flex gap-4 mt-1">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Earned:</span>{" "}
                          <span className="font-medium text-primary">${(b.totalEarned || 0).toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Paid out:</span>{" "}
                          <span className="font-medium">${(b.totalPaidOut || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/30 p-4 border-t flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Current Balance</div>
                      <div className="text-2xl font-black">${(b.balance || 0).toFixed(2)}</div>
                    </div>
                    
                    <Dialog open={payingMemberId === b.member.id} onOpenChange={(open) => !open && setPayingMemberId(null)}>
                      <DialogTrigger asChild>
                        <Button 
                          onClick={() => setPayingMemberId(b.member.id)}
                          disabled={b.balance <= 0}
                          className="rounded-full shadow-sm font-bold px-6"
                        >
                          Pay Out
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pay out {b.member.name}?</DialogTitle>
                          <DialogDescription>
                            This will record a payout of <strong>${(b.balance || 0).toFixed(2)}</strong> and reset their balance to zero. 
                            Did you give them the money?
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                          <Button variant="outline" onClick={() => setPayingMemberId(null)}>Cancel</Button>
                          <Button 
                            onClick={() => handlePayout(b.member.id, b.balance)}
                            disabled={createPayout.isPending}
                          >
                            {createPayout.isPending ? "Processing..." : "Confirm Payout"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
