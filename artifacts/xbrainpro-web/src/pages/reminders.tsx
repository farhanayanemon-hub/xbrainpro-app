import { useState } from "react";
import { useListReminders, useCreateReminder, useUpdateReminder, useDeleteReminder, getListRemindersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Bell, Trash2, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function Reminders() {
  const { data: reminders, isLoading } = useListReminders();
  const createReminder = useCreateReminder();
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTime, setNewTime] = useState("08:00");
  const [newTitle, setNewTitle] = useState("");
  const [newDays, setNewDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const toggleDay = (dayIndex: number) => {
    setNewDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newTime) return;
    
    createReminder.mutate(
      { data: { title: newTitle, timeOfDay: newTime, daysOfWeek: newDays, enabled: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
          setIsDialogOpen(false);
          setNewTitle("");
          setNewTime("08:00");
        }
      }
    );
  };

  const handleToggleEnabled = (id: number, enabled: boolean) => {
    updateReminder.mutate(
      { id, data: { enabled } },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() }) }
    );
  };

  const handleDelete = (id: number) => {
    deleteReminder.mutate(
      { id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() }) }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-heading font-bold text-white mb-2">Protocol Alerts</h1>
          <p className="text-muted-foreground">Manage your daily neural integration reminders.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-12 px-6 bg-primary text-white hover:bg-primary/90 shadow-glow">
              <Plus className="w-5 h-5 mr-2" /> Add Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-white/10 text-white rounded-3xl p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl font-heading">New Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              <div>
                <label className="text-sm text-white/50 mb-2 block">Alert Label</label>
                <Input 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  placeholder="e.g. Morning Protocol"
                  className="bg-white/5 border-white/10 h-12 rounded-xl focus-visible:ring-primary"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/50 mb-2 block">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                  <Input 
                    type="time" 
                    value={newTime} 
                    onChange={e => setNewTime(e.target.value)}
                    className="bg-white/5 border-white/10 h-12 rounded-xl pl-12 text-lg font-mono focus-visible:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-white/50 mb-3 block">Active Days</label>
                <div className="flex justify-between gap-2">
                  {DAYS.map((day, idx) => (
                    <button
                      key={idx}
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full font-medium transition-all ${
                        newDays.includes(idx) ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-white/30 hover:bg-white/10'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCreate}
                disabled={!newTitle || createReminder.isPending}
                className="w-full h-12 rounded-xl bg-white text-black hover:bg-white/90 font-bold"
              >
                {createReminder.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Alert"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {reminders?.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 glass-card rounded-3xl border border-white/5">
              <Bell className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No active alerts. Create one to stay aligned.</p>
            </motion.div>
          )}

          {reminders?.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`glass-card p-6 rounded-3xl border transition-all flex items-center justify-between gap-4 ${
                reminder.enabled ? 'border-primary/20 bg-white/5' : 'border-white/5 opacity-60'
              }`}
            >
              <div className="flex-1">
                <div className="flex items-end gap-3 mb-2">
                  <h3 className={`text-3xl font-heading font-bold ${reminder.enabled ? 'text-white' : 'text-white/50'}`}>
                    {reminder.timeOfDay}
                  </h3>
                  <span className="text-sm font-medium text-white/50 mb-1">{reminder.title}</span>
                </div>
                
                <div className="flex gap-1.5 mt-3">
                  {DAYS.map((day, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[10px] font-bold w-5 text-center ${
                        reminder.daysOfWeek.includes(idx) 
                          ? reminder.enabled ? 'text-primary' : 'text-white/50' 
                          : 'text-white/10'
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Switch 
                  checked={reminder.enabled} 
                  onCheckedChange={(c) => handleToggleEnabled(reminder.id, c)} 
                  className="data-[state=checked]:bg-primary"
                />
                <button 
                  onClick={() => handleDelete(reminder.id)}
                  className="text-white/20 hover:text-destructive transition-colors p-2"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
