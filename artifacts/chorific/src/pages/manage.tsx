import { useState, useEffect } from "react";
import { 
  useGetMembers, 
  useGetChores,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useCreateChore,
  useUpdateChore,
  useDeleteChore,
  useAssignChore,
  useUnassignChore,
  getGetMembersQueryKey,
  getGetChoresQueryKey,
  getGetChecklistQueryKey,
  useGetSettings,
  useUpdateSettings,
  getGetSettingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, ClipboardList, Plus, Trash2, Edit2, AlertCircle, Settings2, Heart, PiggyBank, ShoppingBag } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as Icons from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#84cc16", 
  "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", 
  "#3b82f6", "#6366f1", "#8b5cf6", "#d946ef",
  "#ec4899", "#f43f5e"
];

const PRESET_ICONS = [
  { category: "Cleaning", icons: ["Trash2", "Sparkles", "WashingMachine", "Droplets", "Brush", "Eraser", "Wind", "Recycle"] },
  { category: "Bathroom", icons: ["Bath", "ShowerHead", "Droplet", "ToiletIcon", "Brush", "Sparkles", "Thermometer"] },
  { category: "Kitchen", icons: ["UtensilsCrossed", "Coffee", "ShoppingCart", "Apple", "CookingPot", "Refrigerator", "Pizza", "Sandwich", "Soup", "Citrus"] },
  { category: "Yard", icons: ["Shovel", "Scissors", "Sprout", "Flower2", "TreePine", "Axe", "Leaf", "Trees", "CloudRain", "Tractor", "Sun", "Cloudy"] },
  { category: "Pets", icons: ["Dog", "Cat", "Fish", "Bird", "Rabbit", "PawPrint", "Bone", "Bug"] },
  { category: "Study", icons: ["BookOpen", "Pencil", "GraduationCap", "Brain", "Calculator", "Library", "Microscope", "Globe", "FlaskConical", "Ruler"] },
  { category: "Toys & Play", icons: ["Gamepad2", "Puzzle", "Dices", "Trophy", "Bike", "Music", "Tv", "Volleyball", "Tent", "Backpack", "Guitar", "Palette"] },
  { category: "Health", icons: ["Smile", "Moon", "Sunrise", "Dumbbell", "Apple", "Heart", "Stethoscope", "Pill", "Timer", "BedDouble"] },
  { category: "Chores & Home", icons: ["Star", "Zap", "Package", "Hammer", "Wrench", "Shirt", "Bed", "Car", "Baby", "Key", "Lightbulb", "Mailbox", "Sofa", "Lamp", "Archive"] }
];

const PRESET_EMOJIS = [
  { category: "Cleaning", emojis: ["🧹", "🧺", "🧻", "🧽", "🪣", "🫧", "🧴", "🪠", "🫙", "🧯"] },
  { category: "Bathroom", emojis: ["🛁", "🚿", "🪥", "🧼", "🪒", "🪮", "💊", "🩺"] },
  { category: "Kitchen", emojis: ["🍽️", "🥄", "🍳", "🥗", "☕", "🧁", "🛒", "🍎", "🥪", "🍕", "🫕", "🥘", "🍱", "🥤"] },
  { category: "Yard", emojis: ["🌱", "🌿", "🌳", "🌸", "🌻", "🪴", "🍂", "🌾", "🍀", "🪨", "🌵", "🎋", "🪵", "☀️"] },
  { category: "Pets", emojis: ["🐕", "🐈", "🐠", "🐦", "🐇", "🐾", "🦴", "🐿️", "🐢", "🦎", "🐹", "🦜", "🐓", "🦟"] },
  { category: "Study", emojis: ["📚", "✏️", "📝", "🎓", "🧠", "📖", "🖊️", "📐", "🔬", "🧪", "🌍", "📏", "🖥️", "📓"] },
  { category: "Toys & Play", emojis: ["🧸", "🎮", "🕹️", "🎲", "🧩", "🪀", "🪁", "🏆", "🚲", "🛴", "🎨", "🎭", "🎪", "🎠", "🤸", "⚽", "🏀", "🎾", "🏈", "🎯"] },
  { category: "Music", emojis: ["🎵", "🎶", "🎸", "🎹", "🥁", "🎺", "🎻", "🎤", "🎧", "📻"] },
  { category: "Health & Body", emojis: ["💪", "🏃", "🧘", "😴", "🦷", "🛌", "🚶", "🤸", "⏰", "🧴"] },
  { category: "Home & Life", emojis: ["⭐", "❤️", "⚡", "📦", "🔨", "🔧", "👕", "🛏️", "🚗", "👶", "💰", "🎁", "💡", "🔑", "📬", "🪑", "🛋️", "🖼️", "🪞", "🗑️"] }
];

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarColor: z.string().min(1, "Color is required"),
});

const DAYS_OF_WEEK = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

const choreSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  dollarValue: z.coerce.number().min(0, "Must be at least 0"),
  frequency: z.enum(["daily", "weekly"]),
  scheduledDays: z.array(z.number()).optional(),
  timeOfDay: z.enum(["morning", "afternoon", "evening"]).nullable().optional(),
  assignedMemberIds: z.array(z.number()),
});

type MemberFormValues = z.infer<typeof memberSchema>;
type ChoreFormValues = z.infer<typeof choreSchema>;

function getIconComponent(iconName: string, size = "w-5 h-5") {
  if (iconName?.startsWith("emoji:")) {
    return <span className="text-lg leading-none">{iconName.slice(6)}</span>;
  }
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className={size} /> : <Icons.Circle className={size} />;
}

export default function Manage() {
  const { data: members, isLoading: isLoadingMembers } = useGetMembers();
  const { data: chores, isLoading: isLoadingChores } = useGetChores();
  const { data: settings } = useGetSettings();
  
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  
  const createChore = useCreateChore();
  const updateChore = useUpdateChore();
  const deleteChore = useDeleteChore();
  const assignChore = useAssignChore();
  const unassignChore = useUnassignChore();
  const updateSettings = useUpdateSettings();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  const [choreDialogOpen, setChoreDialogOpen] = useState(false);
  const [editingChoreId, setEditingChoreId] = useState<number | null>(null);
  const [iconMode, setIconMode] = useState<"icon" | "emoji">("icon");

  const [charityPct, setCharityPct] = useState(10);
  const [savingsPct, setSavingsPct] = useState(20);
  const [spendingPct, setSpendingPct] = useState(70);

  useEffect(() => {
    if (settings) {
      setCharityPct(settings.charityPercent);
      setSavingsPct(settings.savingsPercent);
      setSpendingPct(settings.spendingPercent);
    }
  }, [settings]);

  const pctTotal = charityPct + savingsPct + spendingPct;

  const handleSaveSettings = () => {
    if (pctTotal !== 100) {
      toast({ title: "Percentages must add up to 100%", variant: "destructive" });
      return;
    }
    updateSettings.mutate(
      { data: { charityPercent: charityPct, savingsPercent: savingsPct, spendingPercent: spendingPct } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
          toast({ title: "Spending plan saved!" });
        },
        onError: () => {
          toast({ title: "Failed to save settings", variant: "destructive" });
        },
      }
    );
  };

  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", avatarColor: PRESET_COLORS[0] }
  });

  const choreForm = useForm<ChoreFormValues>({
    resolver: zodResolver(choreSchema),
    defaultValues: { name: "", icon: "Sparkles", dollarValue: 1, frequency: "daily", scheduledDays: [], timeOfDay: null, assignedMemberIds: [] }
  });

  const watchedFrequency = useWatch({ control: choreForm.control, name: "frequency" });

  const onOpenMemberNew = () => {
    setEditingMemberId(null);
    memberForm.reset({ name: "", avatarColor: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)] });
    setMemberDialogOpen(true);
  };

  const onOpenMemberEdit = (member: any) => {
    setEditingMemberId(member.id);
    memberForm.reset({ name: member.name, avatarColor: member.avatarColor });
    setMemberDialogOpen(true);
  };

  const onMemberSubmit = (data: MemberFormValues) => {
    if (editingMemberId) {
      updateMember.mutate({ id: editingMemberId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
          setMemberDialogOpen(false);
          toast({ title: "Member updated" });
        }
      });
    } else {
      createMember.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
          setMemberDialogOpen(false);
          toast({ title: "Member added" });
        }
      });
    }
  };

  const handleDeleteMember = (id: number) => {
    deleteMember.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMembersQueryKey() });
        toast({ title: "Member removed" });
      }
    });
  };

  const onOpenChoreNew = () => {
    setEditingChoreId(null);
    setIconMode("icon");
    choreForm.reset({ name: "", icon: "Sparkles", dollarValue: 1, frequency: "daily", scheduledDays: [], timeOfDay: null, assignedMemberIds: [] });
    setChoreDialogOpen(true);
  };

  const onOpenChoreEdit = (chore: any) => {
    setEditingChoreId(chore.id);
    setIconMode(chore.icon?.startsWith("emoji:") ? "emoji" : "icon");
    choreForm.reset({ 
      name: chore.name, 
      icon: chore.icon, 
      dollarValue: chore.dollarValue, 
      frequency: chore.frequency,
      scheduledDays: chore.scheduledDays || [],
      timeOfDay: (chore.timeOfDay as "morning" | "afternoon" | "evening" | null) ?? null,
      assignedMemberIds: chore.assignedMemberIds || [] 
    });
    setChoreDialogOpen(true);
  };

  const syncAssignments = async (choreId: number, newMemberIds: number[], oldMemberIds: number[]) => {
    const toAdd = newMemberIds.filter(id => !oldMemberIds.includes(id));
    const toRemove = oldMemberIds.filter(id => !newMemberIds.includes(id));
    await Promise.all([
      ...toAdd.map(memberId => assignChore.mutateAsync({ id: choreId, data: { memberId } })),
      ...toRemove.map(memberId => unassignChore.mutateAsync({ id: choreId, memberId })),
    ]);
  };

  const onChoreSubmit = (data: ChoreFormValues) => {
    const { assignedMemberIds, scheduledDays, timeOfDay, ...choreData } = data;
    const payload = {
      ...choreData,
      scheduledDays: data.frequency === "weekly" && scheduledDays && scheduledDays.length > 0
        ? scheduledDays
        : null,
      timeOfDay: timeOfDay ?? null,
    };

    if (editingChoreId) {
      const currentChore = chores?.find(c => c.id === editingChoreId);
      const oldIds = currentChore?.assignedMemberIds || [];
      updateChore.mutate({ id: editingChoreId, data: payload }, {
        onSuccess: async () => {
          await syncAssignments(editingChoreId, assignedMemberIds, oldIds);
          queryClient.invalidateQueries({ queryKey: getGetChoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetChecklistQueryKey() });
          setChoreDialogOpen(false);
          toast({ title: "Chore updated" });
        }
      });
    } else {
      createChore.mutate({ data: payload }, {
        onSuccess: async (newChore) => {
          await syncAssignments(newChore.id, assignedMemberIds, []);
          queryClient.invalidateQueries({ queryKey: getGetChoresQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetChecklistQueryKey() });
          setChoreDialogOpen(false);
          toast({ title: "Chore added" });
        }
      });
    }
  };

  const handleDeleteChore = (id: number) => {
    deleteChore.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChoresQueryKey() });
        toast({ title: "Chore removed" });
      }
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Manage Household</h1>
        <p className="text-muted-foreground text-sm">Set up your family members and their chores.</p>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="chores" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Chores
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="members" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight">Members</h2>
            <Button onClick={onOpenMemberNew} className="rounded-full shadow-sm font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Member
            </Button>
          </div>

          {!members || members.length === 0 ? (
             <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card">
               <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" opacity={0.2} />
               <h3 className="text-lg font-medium text-foreground">No members yet</h3>
               <p className="text-muted-foreground mb-4">Add your family members to start assigning chores.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.map(member => (
                <Card key={member.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-inner border-2 border-white/20"
                        style={{ backgroundColor: member.avatarColor }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="font-bold text-lg">{member.name}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onOpenMemberEdit(member)}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {member.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the member and their chore history.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteMember(member.id)}>
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="chores" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold tracking-tight">Chores</h2>
            <Button onClick={onOpenChoreNew} className="rounded-full shadow-sm font-bold" disabled={!members || members.length === 0}>
              <Plus className="w-4 h-4 mr-2" /> Add Chore
            </Button>
          </div>
          
          {(!members || members.length === 0) && (
            <div className="bg-amber-50 border-amber-200 text-amber-800 p-4 rounded-xl flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm">You need to add family members before you can create and assign chores.</div>
            </div>
          )}

          {!chores || chores.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-card">
              <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" opacity={0.2} />
              <h3 className="text-lg font-medium text-foreground">No chores yet</h3>
              <p className="text-muted-foreground mb-4">Create chores and assign them to your family.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {chores.map(chore => (
                <Card key={chore.id} className="overflow-hidden shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {getIconComponent(chore.icon)}
                        </div>
                        <div>
                          <h3 className="font-bold">{chore.name}</h3>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            <span className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                              ${chore.dollarValue.toFixed(2)} • {chore.frequency}
                            </span>
                            {chore.timeOfDay && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                {chore.timeOfDay === "morning" ? "🌅" : chore.timeOfDay === "afternoon" ? "☀️" : "🌙"} {chore.timeOfDay}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onOpenChoreEdit(chore)}>
                          <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {chore.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently remove the chore. Past completions will still appear in history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDeleteChore(chore.id)}>
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    <div className="bg-muted/50 p-2 rounded-lg mt-2">
                      <div className="text-xs text-muted-foreground mb-1 font-medium">Assigned to:</div>
                      <div className="flex flex-wrap gap-1">
                        {chore.assignedMemberIds && chore.assignedMemberIds.length > 0 ? (
                          chore.assignedMemberIds.map(id => {
                            const member = members?.find(m => m.id === id);
                            if (!member) return null;
                            return (
                              <div 
                                key={id} 
                                className="text-xs px-2 py-0.5 rounded-full text-white font-medium flex items-center gap-1"
                                style={{ backgroundColor: member.avatarColor }}
                              >
                                {member.name}
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1">Spending Plan</h2>
            <p className="text-sm text-muted-foreground">
              Set recommended percentages for how kids should split their payout. These are shown as a guide during each payout.
            </p>
          </div>

          <div className="space-y-4">
            {/* Charity */}
            <Card className="border-red-100 bg-red-50/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Charity</p>
                    <p className="text-xs text-muted-foreground">Give back to others</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={charityPct}
                    onChange={e => setCharityPct(Number(e.target.value))}
                    className="flex-1 accent-red-500"
                  />
                  <div className="flex items-center border rounded-lg overflow-hidden bg-white w-20">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={charityPct}
                      onChange={e => setCharityPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="border-0 text-center font-bold p-1 h-8 w-14"
                    />
                    <span className="pr-2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Savings */}
            <Card className="border-blue-100 bg-blue-50/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <PiggyBank className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Savings</p>
                    <p className="text-xs text-muted-foreground">Save for the future</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={savingsPct}
                    onChange={e => setSavingsPct(Number(e.target.value))}
                    className="flex-1 accent-blue-500"
                  />
                  <div className="flex items-center border rounded-lg overflow-hidden bg-white w-20">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={savingsPct}
                      onChange={e => setSavingsPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="border-0 text-center font-bold p-1 h-8 w-14"
                    />
                    <span className="pr-2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Spending */}
            <Card className="border-green-100 bg-green-50/40">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Spending</p>
                    <p className="text-xs text-muted-foreground">Enjoy now</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={spendingPct}
                    onChange={e => setSpendingPct(Number(e.target.value))}
                    className="flex-1 accent-green-500"
                  />
                  <div className="flex items-center border rounded-lg overflow-hidden bg-white w-20">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={spendingPct}
                      onChange={e => setSpendingPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="border-0 text-center font-bold p-1 h-8 w-14"
                    />
                    <span className="pr-2 text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total indicator */}
            <div className={`flex items-center justify-between rounded-xl border px-4 py-3 font-semibold text-sm ${pctTotal === 100 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
              <span>Total</span>
              <span>{pctTotal}% {pctTotal === 100 ? "✓" : `(need ${100 - pctTotal > 0 ? "+" : ""}${100 - pctTotal}% to reach 100%)`}</span>
            </div>

            {/* Preview */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Preview for $10.00 payout</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5 text-red-400" /> Charity</span>
                    <span className="font-bold">${((10 * charityPct) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5"><PiggyBank className="w-3.5 h-3.5 text-blue-400" /> Savings</span>
                    <span className="font-bold">${((10 * savingsPct) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5 text-green-400" /> Spending</span>
                    <span className="font-bold">${((10 * spendingPct) / 100).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSaveSettings}
              disabled={pctTotal !== 100 || updateSettings.isPending}
              className="w-full rounded-full font-bold"
            >
              {updateSettings.isPending ? "Saving..." : "Save Spending Plan"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMemberId ? "Edit Member" : "Add Member"}</DialogTitle>
          </DialogHeader>
          <Form {...memberForm}>
            <form onSubmit={memberForm.handleSubmit(onMemberSubmit)} className="space-y-6 mt-4">
              <FormField
                control={memberForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Alex" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={memberForm.control}
                name="avatarColor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar Color</FormLabel>
                    <FormControl>
                      <div className="grid grid-cols-7 gap-2">
                        {PRESET_COLORS.map(color => (
                          <div 
                            key={color}
                            onClick={() => field.onChange(color)}
                            className={`w-8 h-8 rounded-full cursor-pointer border-2 flex items-center justify-center transition-all hover:scale-110 ${field.value === color ? 'border-foreground shadow-md' : 'border-transparent'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMemberDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMember.isPending || updateMember.isPending}>
                  Save Member
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Chore Dialog */}
      <Dialog open={choreDialogOpen} onOpenChange={setChoreDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingChoreId ? "Edit Chore" : "Add Chore"}</DialogTitle>
          </DialogHeader>
          <Form {...choreForm}>
            <form onSubmit={choreForm.handleSubmit(onChoreSubmit)} className="space-y-6 mt-4 flex-1 overflow-y-auto pr-2">
              <FormField
                control={choreForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chore Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Empty Dishwasher" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={choreForm.control}
                  name="dollarValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward ($)</FormLabel>
                      <FormControl>
                        <Input type="number" step="any" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={choreForm.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select value={field.value} onValueChange={(val) => {
                        field.onChange(val);
                        if (val === "daily") choreForm.setValue("scheduledDays", []);
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchedFrequency === "weekly" && (
                <FormField
                  control={choreForm.control}
                  name="scheduledDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Which day(s)?</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {DAYS_OF_WEEK.map(day => {
                          const selected = (field.value || []).includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              onClick={() => {
                                const current = field.value || [];
                                field.onChange(
                                  selected
                                    ? current.filter(d => d !== day.value)
                                    : [...current, day.value]
                                );
                              }}
                              className={`w-11 h-11 rounded-full text-sm font-semibold border transition-colors ${
                                selected
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                              }`}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Leave blank to show every week day.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={choreForm.control}
                name="timeOfDay"
                render={({ field }) => {
                  const options = [
                    { value: null,        label: "Any time", emoji: "🕐" },
                    { value: "morning",   label: "Morning",  emoji: "🌅" },
                    { value: "afternoon", label: "Afternoon",emoji: "☀️" },
                    { value: "evening",   label: "Evening",  emoji: "🌙" },
                  ] as const;
                  return (
                    <FormItem>
                      <FormLabel>Time of Day</FormLabel>
                      <div className="flex gap-2 flex-wrap mt-1">
                        {options.map(opt => (
                          <button
                            key={String(opt.value)}
                            type="button"
                            onClick={() => field.onChange(opt.value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium transition-colors ${
                              field.value === opt.value
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-primary"
                            }`}
                          >
                            <span>{opt.emoji}</span>
                            {opt.label}
                          </button>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={choreForm.control}
                name="assignedMemberIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {members?.map((member) => (
                        <FormField
                          key={member.id}
                          control={choreForm.control}
                          name="assignedMemberIds"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={member.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 bg-muted/20"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(member.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), member.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== member.id)
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: member.avatarColor }}
                                  />
                                  {member.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={choreForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-1">
                      <FormLabel className="mb-0">Icon</FormLabel>
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIconMode("icon");
                            if (field.value?.startsWith("emoji:")) field.onChange("Sparkles");
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${iconMode === "icon" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Icons
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIconMode("emoji");
                            if (!field.value?.startsWith("emoji:")) field.onChange("emoji:⭐");
                          }}
                          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${iconMode === "emoji" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          Emoji
                        </button>
                      </div>
                    </div>
                    <FormControl>
                      <div className="border rounded-xl p-4 bg-muted/10 h-64 overflow-y-auto">
                        {iconMode === "icon" ? (
                          PRESET_ICONS.map(category => (
                            <div key={category.category} className="mb-4 last:mb-0">
                              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{category.category}</h4>
                              <div className="grid grid-cols-6 gap-2">
                                {category.icons.map(iconName => (
                                  <div
                                    key={iconName}
                                    onClick={() => field.onChange(iconName)}
                                    className={`aspect-square flex items-center justify-center rounded-md cursor-pointer transition-colors ${field.value === iconName ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                                    title={iconName}
                                  >
                                    {getIconComponent(iconName)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          PRESET_EMOJIS.map(category => (
                            <div key={category.category} className="mb-4 last:mb-0">
                              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase">{category.category}</h4>
                              <div className="grid grid-cols-8 gap-1">
                                {category.emojis.map(emoji => {
                                  const emojiValue = `emoji:${emoji}`;
                                  return (
                                    <div
                                      key={emoji}
                                      onClick={() => field.onChange(emojiValue)}
                                      className={`aspect-square flex items-center justify-center rounded-md cursor-pointer text-xl transition-colors ${field.value === emojiValue ? 'bg-primary shadow-sm ring-2 ring-primary' : 'bg-background hover:bg-muted'}`}
                                    >
                                      {emoji}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-4 pt-4 border-t sticky bottom-0 bg-background pb-2">
                <Button type="button" variant="outline" onClick={() => setChoreDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createChore.isPending || updateChore.isPending}>
                  Save Chore
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
