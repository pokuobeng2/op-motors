import { useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inspectionMessage, whatsappLink, type VehicleRef } from "@/lib/contact";

const TIMES = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"];

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export function InspectionDialog({ vehicle, whatsapp }: { vehicle: VehicleRef; whatsapp: string }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const ready = date && time;

  const prettyDate = date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="w-full">
          <CalendarCheck /> Book an inspection
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Book an inspection</DialogTitle>
          <DialogDescription>
            Choose a preferred date and time. We'll open WhatsApp with your request — our team will confirm the
            appointment with you there.
          </DialogDescription>
          <div className="mt-2 flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-xs font-medium text-foreground ring-1 ring-border">
            <span>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
            <span className="font-mono font-semibold text-muted-foreground">
              Stock #{vehicle.reference}
            </span>
          </div>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!ready) return;
            window.open(whatsappLink(whatsapp, inspectionMessage(vehicle, prettyDate, time, name)), "_blank", "noopener");
            setOpen(false);
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="insp-name">Your name (optional)</Label>
            <Input id="insp-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="insp-date">Preferred date</Label>
              <Input id="insp-date" type="date" min={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Preferred time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger aria-label="Preferred time">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {TIMES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" variant="whatsapp" size="lg" disabled={!ready}>
            Send request on WhatsApp
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            This is a request, not a confirmed booking.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
