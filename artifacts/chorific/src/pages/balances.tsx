import {
  useGetSummary, getGetSummaryQueryKey,
  useGetBalances, getGetBalancesQueryKey,
  useGetMembers,
  useCreatePayout, getGetPayoutsQueryKey,
  useGetPayouts,
  useGetSettings, getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trophy, CheckCircle2, TrendingUp, HandCoins, Wallet, Heart, PiggyBank, ShoppingBag, History } from "lucide-react";
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

function SpendingPlan({ amount, charity, savings, spending }: {
  amount: number;
  charity: number;
  savings: number;
  spending: number;
}) {
  const charityAmt = (amount * charity) / 100;
  const savingsAmt = (amount * savings) / 100;
  const spendingAmt = (amount * spending) / 100;

  return (
    <div className="mt-4 rounded-xl border bg-muted/30 p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recommended Spending Plan</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-red-500" />
          </div>
          <span className="text-sm font-medium">Charity <span className="text-muted-foreground">({charity}%)</span></span>
        </div>
        <span className="font-bold text-sm">${charityAmt.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <PiggyBank className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <span className="text-sm font-medium">Savings <span className="text-muted-foreground">({savings}%)</span></span>
        </div>
        <span className="font-bold text-sm">${savingsAmt.toFixed(2)}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
            <ShoppingBag className="w-3.5 h-3.5 text-green-500" />
          </div>
          <span className="text-sm font-medium">Spending <span className="text-muted-foreground">({spending}%)</span></span>
        </div>
        <span className="font-bold text-sm">${spendingAmt.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default function Balances() {
  const { data: summary, isLoading: isLoadingSummary } = useGetSummary();
  const { data: balances, isLoading: isLoadingBalances } = useGetBalances();
  const { data: members, isLoading: isLoadingMembers } = useGetMembers();
  const { data: payouts, isLoading: isLoadingPayouts } = useGetPayouts();
  const { data: settings } = useGetSettings();
  const createPayout = useCreatePayout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [payingMemberId, setPayingMemberId] = useState<number | null>(null);

  const isLoading = isLoadingSummary || isLoadingBalances || isLoadingMembers || isLoadingPayouts;

  const charity = settings?.charityPercent ?? 10;
  const savings = settings?.savingsPercent ?? 20;
  const spending = settings?.spendingPercent ?? 70;

  const handlePayout = (memberId: number, amount: number) => {
    createPayout.mutate(
      { data: { memberId, amount } },
      {
        onSuccess: () => {
          toast({ title: "Payout successful!", description: `Paid out $${amount.toFixed(2)}.` });
          queryClient.invalidateQueries({ queryKey: getGetBalancesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPayoutsQueryKey() });
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
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Summary stats */}
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

      {/* Family Balances */}
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
                          </DialogDescription>
                        </DialogHeader>

                        <SpendingPlan
                          amount={b.balance || 0}
                          charity={charity}
                          savings={savings}
                          spending={spending}
                        />

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

      {/* Payout History */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-xl font-bold tracking-tight">Payout History</h2>
        </div>

        {(!payouts || payouts.length === 0) ? (
          <div className="text-center py-10 border-2 border-dashed rounded-xl bg-card">
            <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" opacity={0.2} />
            <p className="text-muted-foreground">No payouts recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => {
              const member = balances?.find(b => b.member.id === payout.memberId)?.member;
              const avatarColor = member?.avatarColor ?? "#94a3b8";
              const initial = payout.memberName.charAt(0).toUpperCase();
              const date = new Date(payout.paidAt);
              const charityAmt = (payout.amount * charity) / 100;
              const savingsAmt = (payout.amount * savings) / 100;
              const spendingAmt = (payout.amount * spending) / 100;

              return (
                <Card key={payout.id} className="shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4 flex items-start gap-4">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {initial}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-base">{payout.memberName}</span>
                          <Badge variant="secondary" className="font-bold text-sm shrink-0">
                            ${payout.amount.toFixed(2)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}{" "}
                          at {date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span className="text-xs font-semibold text-red-600">Charity ${charityAmt.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
                            <PiggyBank className="w-3 h-3 text-blue-400" />
                            <span className="text-xs font-semibold text-blue-600">Savings ${savingsAmt.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1">
                            <ShoppingBag className="w-3 h-3 text-green-400" />
                            <span className="text-xs font-semibold text-green-600">Spending ${spendingAmt.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
