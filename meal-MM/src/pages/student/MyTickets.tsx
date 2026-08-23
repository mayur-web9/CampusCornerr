import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";

import { getMyTickets } from "../../lib/ticketService";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  created_at: string;
}

export default function MyTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);

      const data = await getMyTickets();

      setTickets(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load your tickets.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-24 rounded-2xl bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="My Tickets"
        subtitle="Track all your support requests."
        actions={
          <Link to="/student/tickets/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Raise Ticket
          </Link>
        }
      />

      {tickets.length === 0 && (
        <div className="card">
          <EmptyState
            icon={MessageSquareText}
            title="No Tickets Yet"
            description="You haven't submitted any support requests."
            action={
              <Link to="/student/tickets/new" className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Raise Ticket
              </Link>
            }
          />
        </div>
      )}

      {tickets.length > 0 && (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Link key={ticket.id} to={`/student/tickets/${ticket.id}`} className="block">
              <div className="card card-hover hover:border-red-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-400">
                      TKT-{ticket.ticket_number.toString().padStart(4, "0")}
                    </p>
                    <h2 className="text-lg font-semibold text-slate-900 mt-1">{ticket.subject}</h2>
                    <p className="text-sm text-gray-500 mt-2">
                      Submitted on{" "}
                      {new Date(ticket.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 flex-shrink-0">
                    <StatusBadge status={ticket.status} />
                    <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
