import { useState } from "react";
import { format } from "date-fns";
import { 
  useGetHistory, 
  getGetHistoryQueryKey, 
  useGetMembers 
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { History as HistoryIcon, FilterX } from "lucide-react";
import * as Icons from "lucide-react";

export default function History() {
  const [selectedMemberId, setSelectedMemberId] = useState<number | "all">("all");
  
  const { data: members } = useGetMembers();
  
  const { data: history, isLoading } = useGetHistory(
    { memberId: selectedMemberId === "all" ? undefined : selectedMemberId },
    { query: { queryKey: getGetHistoryQueryKey({ memberId: selectedMemberId === "all" ? undefined : selectedMemberId }) } }
  );

  const getIcon = (iconName: string) => {
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5" /> : <Icons.CheckCircle2 className="w-5 h-5" />;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">History</h1>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedMemberId.toString()} 
            onValueChange={(val) => setSelectedMemberId(val === "all" ? "all" : parseInt(val))}
          >
            <SelectTrigger className="w-[180px] bg-card">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members?.map(m => (
                <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedMemberId !== "all" && (
            <button 
              onClick={() => setSelectedMemberId("all")}
              className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
              title="Clear filter"
            >
              <FilterX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (!history || history.entries.length === 0) ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card">
          <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" opacity={0.2} />
          <h3 className="text-lg font-medium text-foreground">No history yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">
            Completed chores will show up here. Check off some chores to build your history!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.entries.map((entry) => (
            <Card key={entry.id} className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: entry.memberAvatarColor }}
                >
                  {getIcon(entry.choreIcon)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{entry.choreName}</h4>
                    <span className="font-bold text-primary shrink-0 whitespace-nowrap">
                      +${entry.amountEarned.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5 truncate">
                      <div 
                        className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center text-white font-bold shrink-0"
                        style={{ backgroundColor: entry.memberAvatarColor }}
                      >
                        {entry.memberName.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{entry.memberName}</span>
                    </div>
                    <span className="shrink-0 whitespace-nowrap text-xs">
                      {format(new Date(entry.completedAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
