import { useEffect, useState } from 'react';
import { Shield, UserPlus, Trash2, MapPin, Calendar, Clock, CheckCircle2, X, Plus, DoorOpen, Flag, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { safetyApi, type TrustedContact, type DatePlan } from '@/lib/api/safety';
import { toast } from 'sonner';

export function SafetySettings() {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [datePlans, setDatePlans] = useState<DatePlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [newPlan, setNewPlan] = useState({
    matchName: '',
    location: '',
    scheduledAt: '',
    durationMinutes: 60,
    notes: '',
    trustedContactIds: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [contactsRes, plansRes] = await Promise.all([
        safetyApi.getTrustedContacts(),
        safetyApi.getDatePlans()
      ]);
      setContacts(contactsRes.contacts);
      setDatePlans(plansRes.plans);
    } catch {
      toast.error('Failed to load safety data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.relationship) {
      toast.error('Name and relationship are required');
      return;
    }
    if (!newContact.phone && !newContact.email) {
      toast.error('At least one of phone or email is required');
      return;
    }
    try {
      const res = await safetyApi.addTrustedContact(newContact);
      setContacts((prev) => [...prev, res.contact]);
      setNewContact({ name: '', phone: '', email: '', relationship: '' });
      setShowAddContact(false);
      toast.success('Trusted contact added');
    } catch {
      toast.error('Failed to add contact');
    }
  };

  const handleRemoveContact = async (id: string) => {
    try {
      await safetyApi.removeTrustedContact(id);
      setContacts((prev) => prev.filter((c) => c.id !== id));
      toast.success('Contact removed');
    } catch {
      toast.error('Failed to remove contact');
    }
  };

  const handleCreatePlan = async () => {
    if (!newPlan.matchName || !newPlan.location || !newPlan.scheduledAt) {
      toast.error('Match name, location, and time are required');
      return;
    }
    try {
      const res = await safetyApi.createDatePlan({
        ...newPlan,
        trustedContactIds: newPlan.trustedContactIds
      });
      setDatePlans((prev) => [res.plan, ...prev]);
      setNewPlan({ matchName: '', location: '', scheduledAt: '', durationMinutes: 60, notes: '', trustedContactIds: [] });
      setShowAddPlan(false);
      toast.success('Date plan created');
    } catch {
      toast.error('Failed to create date plan');
    }
  };

  const handleCheckIn = async (id: string, mood: string) => {
    try {
      const res = await safetyApi.checkInDatePlan(id, mood);
      setDatePlans((prev) => prev.map((p) => (p.id === id ? res.plan : p)));
      toast.success('Checked in safely!');
    } catch {
      toast.error('Failed to check in');
    }
  };

  const handleComplete = async (id: string, mood: string) => {
    try {
      const res = await safetyApi.completeDatePlan(id, mood);
      setDatePlans((prev) => prev.map((p) => (p.id === id ? res.plan : p)));
      toast.success('Date marked as completed');
    } catch {
      toast.error('Failed to complete');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const res = await safetyApi.cancelDatePlan(id);
      setDatePlans((prev) => prev.map((p) => (p.id === id ? res.plan : p)));
      toast.success('Date plan cancelled');
    } catch {
      toast.error('Failed to cancel');
    }
  };

  const toggleContactForPlan = (contactId: string) => {
    setNewPlan((prev) => ({
      ...prev,
      trustedContactIds: prev.trustedContactIds.includes(contactId)
        ? prev.trustedContactIds.filter((id) => id !== contactId)
        : [...prev.trustedContactIds, contactId]
    }));
  };

  const statusColor: Record<string, string> = {
    upcoming: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    'checked-in': 'bg-emerald-100 text-emerald-700',
    'alert-sent': 'bg-red-100 text-red-700',
    completed: 'bg-neutral-100 text-neutral-600',
    cancelled: 'bg-neutral-100 text-neutral-400'
  };

  if (isLoading) {
    return <div className="text-sm text-neutral-500">Loading safety settings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Trusted Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Trusted Contacts
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddContact(!showAddContact)}>
              {showAddContact ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            People who will be notified if you trigger an SOS or miss a date check-in. Max 5.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddContact && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Mom, Best friend..."
                  />
                </div>
                <div>
                  <Label className="text-xs">Relationship *</Label>
                  <Input
                    value={newContact.relationship}
                    onChange={(e) => setNewContact((p) => ({ ...p, relationship: e.target.value }))}
                    placeholder="Parent, Friend..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={newContact.phone}
                    onChange={(e) => setNewContact((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 555-0123"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    value={newContact.email}
                    onChange={(e) => setNewContact((p) => ({ ...p, email: e.target.value }))}
                    placeholder="name@email.com"
                  />
                </div>
              </div>
              <Button size="sm" onClick={handleAddContact}>
                <Plus className="w-4 h-4 mr-1" /> Add Contact
              </Button>
            </div>
          )}

          {contacts.length === 0 && !showAddContact && (
            <p className="text-sm text-neutral-400">No trusted contacts yet. Add someone you trust.</p>
          )}

          {contacts.map((contact) => (
            <div key={contact.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{contact.name}</p>
                <p className="text-xs text-neutral-500">
                  {contact.relationship}
                  {contact.phone && ` · ${contact.phone}`}
                  {contact.email && ` · ${contact.email}`}
                </p>
              </div>
              <button
                onClick={() => handleRemoveContact(contact.id)}
                className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Date Plans */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Date Plans
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowAddPlan(!showAddPlan)}>
              {showAddPlan ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-neutral-500">
            Plan a safe date with check-in reminders and trusted contact alerts.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {showAddPlan && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Who are you meeting? *</Label>
                  <Input
                    value={newPlan.matchName}
                    onChange={(e) => setNewPlan((p) => ({ ...p, matchName: e.target.value }))}
                    placeholder="Their name"
                  />
                </div>
                <div>
                  <Label className="text-xs">Location *</Label>
                  <Input
                    value={newPlan.location}
                    onChange={(e) => setNewPlan((p) => ({ ...p, location: e.target.value }))}
                    placeholder="Café, park..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Date & time *</Label>
                  <Input
                    type="datetime-local"
                    value={newPlan.scheduledAt}
                    onChange={(e) => setNewPlan((p) => ({ ...p, scheduledAt: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs">Duration (minutes)</Label>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    value={newPlan.durationMinutes}
                    onChange={(e) => setNewPlan((p) => ({ ...p, durationMinutes: parseInt(e.target.value) || 60 }))}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes (optional)</Label>
                <Input
                  value={newPlan.notes}
                  onChange={(e) => setNewPlan((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="What to wear, conversation topics..."
                />
              </div>
              {contacts.length > 0 && (
                <div>
                  <Label className="text-xs">Notify these contacts</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {contacts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => toggleContactForPlan(c.id)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                          newPlan.trustedContactIds.includes(c.id)
                            ? 'bg-primary text-white'
                            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <Button size="sm" onClick={handleCreatePlan}>
                <Calendar className="w-4 h-4 mr-1" /> Create Date Plan
              </Button>
            </div>
          )}

          {datePlans.length === 0 && !showAddPlan && (
            <p className="text-sm text-neutral-400">No date plans yet. Create one before meeting someone IRL.</p>
          )}

          {datePlans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-neutral-200 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{plan.matchName}</span>
                  <Badge className={statusColor[plan.status] || 'bg-neutral-100'}>{plan.status}</Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{plan.location}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(plan.scheduledAt).toLocaleString()}</span>
                <span>{plan.durationMinutes} min</span>
              </div>
              {plan.checkInBy && plan.status === 'upcoming' && (
                <p className="text-xs text-amber-600">Check in by {new Date(plan.checkInBy).toLocaleTimeString()}</p>
              )}
              {(plan.status === 'upcoming' || plan.status === 'active') && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => handleCheckIn(plan.id, 'great')}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> I'm safe
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleComplete(plan.id, 'great')}>
                    Complete
                  </Button>
                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => {
                    const el = document.getElementById('exit-toolkit-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <DoorOpen className="w-3 h-3 mr-1" /> Exit plan
                  </Button>
                  <Button size="sm" variant="ghost" className="text-neutral-400" onClick={() => handleCancel(plan.id)}>
                    Cancel
                  </Button>
                </div>
              )}
              {plan.status === 'checked-in' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Checked in at {plan.checkedInAt ? new Date(plan.checkedInAt).toLocaleTimeString() : '—'}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleComplete(plan.id, 'great')}>
                    Mark complete
                  </Button>
                </div>
              )}
              {plan.status === 'completed' && (
                <div className="space-y-1.5">
                  {plan.moodCheckIn && (
                    <p className="text-xs text-neutral-500">Mood: {plan.moodCheckIn}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" className="text-xs h-6 text-neutral-400 hover:text-red-500">
                      <Flag className="w-3 h-3 mr-1" /> Report
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-6 text-neutral-400 hover:text-red-500">
                      <Ban className="w-3 h-3 mr-1" /> Block
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
