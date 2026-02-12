import { useEffect, useState } from 'react';
import { DoorOpen, Send, Phone, Clock, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { safetyApi, type ExitTemplate, type RescueCall } from '@/lib/api/safety';
import { toast } from 'sonner';

const CATEGORY_COLORS: Record<string, string> = {
  emergency: 'bg-red-100 text-red-700',
  polite: 'bg-blue-100 text-blue-700',
  boundary: 'bg-purple-100 text-purple-700',
  custom: 'bg-neutral-100 text-neutral-600',
};

export function ExitToolkit() {
  const [templates, setTemplates] = useState<ExitTemplate[]>([]);
  const [rescueCalls, setRescueCalls] = useState<RescueCall[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ExitTemplate | null>(null);
  const [customMessage, setCustomMessage] = useState('');
  const [showRescue, setShowRescue] = useState(false);
  const [rescueMinutes, setRescueMinutes] = useState(30);
  const [rescueMessage, setRescueMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tRes, cRes] = await Promise.all([
        safetyApi.getExitTemplates(),
        safetyApi.getRescueCalls()
      ]);
      setTemplates(tRes.templates);
      setRescueCalls(cRes.calls.filter((c) => c.status === 'scheduled'));
    } catch {
      // Silent
    }
  };

  const handleSendExit = async () => {
    try {
      const res = await safetyApi.sendExitText({
        templateId: selectedTemplate?.id,
        customMessage: customMessage || undefined,
        recipientType: 'self'
      });
      toast.success(`Exit text sent to ${res.to}: "${res.message.substring(0, 60)}..."`);
      setSelectedTemplate(null);
      setCustomMessage('');
    } catch {
      toast.error('Failed to send exit text');
    }
  };

  const handleScheduleRescue = async () => {
    const scheduledAt = new Date(Date.now() + rescueMinutes * 60000).toISOString();
    try {
      await safetyApi.scheduleRescueCall({
        scheduledAt,
        message: rescueMessage || undefined
      });
      toast.success(`Rescue reminder scheduled in ${rescueMinutes} minutes`);
      setShowRescue(false);
      setRescueMessage('');
      loadData();
    } catch {
      toast.error('Failed to schedule');
    }
  };

  const handleCancelRescue = async (id: string) => {
    try {
      await safetyApi.cancelRescueCall(id);
      toast.success('Rescue call cancelled');
      loadData();
    } catch {
      toast.error('Failed to cancel');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-primary" />
          Exit Strategy Toolkit
        </CardTitle>
        <p className="text-xs text-neutral-500">Pre-written exit texts and timed rescue reminders for dates.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exit text templates */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-neutral-600">Quick exit texts</p>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(selectedTemplate?.id === t.id ? null : t)}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  selectedTemplate?.id === t.id ? 'border-primary bg-primary/5' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge className={CATEGORY_COLORS[t.category]} variant="secondary">{t.category}</Badge>
                </div>
                <p className="text-xs font-medium">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {selectedTemplate && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <p className="text-xs text-neutral-700">{selectedTemplate.message}</p>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Or write your own message..."
              className="text-xs min-h-[50px]"
            />
            <Button size="sm" onClick={handleSendExit} className="w-full">
              <Send className="w-3.5 h-3.5 mr-1.5" /> Send to myself
            </Button>
          </div>
        )}

        {/* Rescue call scheduler */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-neutral-600 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Rescue reminder
            </p>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowRescue(!showRescue)}>
              {showRescue ? 'Cancel' : 'Schedule'}
            </Button>
          </div>

          {showRescue && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 space-y-2">
              <p className="text-xs text-amber-700">Schedule a reminder notification as an excuse to leave.</p>
              <div className="flex gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setRescueMinutes(mins)}
                    className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                      rescueMinutes === mins ? 'bg-amber-200 text-amber-800' : 'bg-white text-neutral-600 hover:bg-amber-100'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <Input
                value={rescueMessage}
                onChange={(e) => setRescueMessage(e.target.value)}
                placeholder="Custom reminder text (optional)"
                className="text-xs h-8"
              />
              <Button size="sm" onClick={handleScheduleRescue} className="w-full">
                <Clock className="w-3.5 h-3.5 mr-1.5" /> Schedule in {rescueMinutes} min
              </Button>
            </div>
          )}
        </div>

        {/* Active rescue calls */}
        {rescueCalls.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-neutral-500">Scheduled reminders</p>
            {rescueCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                <div>
                  <p className="text-amber-700 font-medium">{new Date(call.scheduledAt).toLocaleTimeString()}</p>
                  <p className="text-amber-600/70">{call.message.substring(0, 50)}</p>
                </div>
                <button onClick={() => handleCancelRescue(call.id)} className="p-1 text-amber-400 hover:text-red-500">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
