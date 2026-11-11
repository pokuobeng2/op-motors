import { useState, useEffect } from "react";
import { History, User, Clock, ArrowRight, Loader2, Tag, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { getAdminActivityLogs, type ActivityLogRow } from "@/lib/admin-data";
import { toast } from "sonner";

export function ActivityLogView() {
  const [logs, setLogs] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getAdminActivityLogs(100);
        setLogs(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "vehicle_created":
      case "vehicle_published":
        return "available";
      case "price_changed":
        return "gold";
      case "status_changed":
        return "reserved";
      case "vehicle_deleted":
        return "destructive";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground px-4">
            No administrative activities recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-3.5 sm:p-4 transition-colors hover:bg-surface/30 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={getActionBadgeVariant(log.action)} className="capitalize text-[10px] sm:text-[11px]">
                      {log.action.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {log.entity_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground shrink-0">
                    <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                    <span>{formatDateTime(log.created_at)}</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm font-semibold text-foreground pt-0.5">{log.summary}</p>

                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
                  <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>By {log.actor_name || "System"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
