import { useState } from "react";
import { 
  useGetMembers, 
  useGetChores,
  useCreateMember,
  useUpdateMember,
  useDeleteMember,
  useCreateChore,
  useUpdateChore,
  useDeleteChore,
  getGetMembersQueryKey,
  getGetChoresQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
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
import { Users, ClipboardList, Plus, Trash2, Edit2, AlertCircle } from "lucide-react";
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
  { category: "Cleaning", icons: ["Trash2", "Sparkles", "WashingMachine", "Droplets"] },
  { category: "Kitchen", icons: ["UtensilsCrossed", "Coffee", "ShoppingCart", "Apple"] },
  { category: "Outdoor", icons: ["Leaf", "Trees", "Sun", "Wind"] },
  { category: "Pets", icons: ["Dog", "Cat", "Fish"] },
  { category: "Study", icons: ["BookOpen", "Pencil", "GraduationCap"] },
  { category: "Misc", icons: ["Star", "Heart", "Zap", "Package", "Hammer", "Wrench", "Shirt", "Bed", "Car", "Baby"] }
];

const memberSchema = z.object({
  name: z.string().min(1, "Name is required"),
  avatarColor: z.string().min(1, "Color is required"),
});

const choreSchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().min(1, "Icon is required"),
  dollarValue: z.coerce.number().min(0, "Must be at least 0"),
  frequency: z.enum(["daily", "weekly"]),
  assignedMemberIds: z.array(z.number()),
});

type MemberFormValues = z.infer<typeof memberSchema>;
type ChoreFormValues = z.infer<typeof choreSchema>;

function getIconComponent(iconName: string) {
  const Icon = (Icons as any)[iconName];
  return Icon ? <Icon className="w-5 h-5" /> : <Icons.Circle className="w-5 h-5" />;
}

export default function Manage() {
  const { data: members, isLoading: isLoadingMembers } = useGetMembers();
  const { data: chores, isLoading: isLoadingChores } = useGetChores();
  
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  
  const createChore = useCreateChore();
  const updateChore = useUpdateChore();
  const deleteChore = useDeleteChore();

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null);

  const [choreDialogOpen, setChoreDialogOpen] = useState(false);
  const [editingChoreId, setEditingChoreId] = useState<number | null>(null);

  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: { name: "", avatarColor: PRESET_COLORS[0] }
  });

  const choreForm = useForm<ChoreFormValues>({
    resolver: zodResolver(choreSchema),
    defaultValues: { name: "", icon: "Sparkles", dollarValue: 1, frequency: "daily", assignedMemberIds: [] }
  });

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
    choreForm.reset({ name: "", icon: "Sparkles", dollarValue: 1, frequency: "daily", assignedMemberIds: [] });
    setChoreDialogOpen(true);
  };

  const onOpenChoreEdit = (chore: any) => {
    setEditingChoreId(chore.id);
    choreForm.reset({ 
      name: chore.name, 
      icon: chore.icon, 
      dollarValue: chore.dollarValue, 
      frequency: chore.frequency, 
      assignedMemberIds: chore.assignedMemberIds || [] 
    });
    setChoreDialogOpen(true);
  };

  const onChoreSubmit = (data: ChoreFormValues) => {
    if (editingChoreId) {
      updateChore.mutate({ id: editingChoreId, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChoresQueryKey() });
          setChoreDialogOpen(false);
          toast({ title: "Chore updated" });
        }
      });
    } else {
      createChore.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChoresQueryKey() });
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
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Family Members
          </TabsTrigger>
          <TabsTrigger value="chores" className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Chores List
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
                          <div className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                            ${chore.dollarValue.toFixed(2)} • {chore.frequency}
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
                        <Input type="number" step="0.25" min="0" {...field} />
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
                      <Select value={field.value} onValueChange={field.onChange}>
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
                    <FormLabel>Icon</FormLabel>
                    <FormControl>
                      <div className="border rounded-xl p-4 bg-muted/10 h-64 overflow-y-auto">
                        {PRESET_ICONS.map(category => (
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
                        ))}
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
