import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquareText, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import { getAllTickets } from "../../lib/ticketService";
import PageHeader from "../../components/ui/PageHeader";
import SearchBar from "../../components/ui/SearchBar";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  created_at: string;

  students: {
    full_name: string;
    student_code: string;
    room_number: string;
    hostel_block: string;
  };
}

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  async function loadTickets() {
    try {
      setLoading(true);

      const data = await getAllTickets();

      setTickets(data || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load tickets.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTickets = useMemo(() => {
    if (!search.trim()) return tickets;

    const keyword = search.toLowerCase();

    return tickets.filter((ticket) => {
      return (
        ticket.subject.toLowerCase().includes(keyword) ||
        ticket.students.full_name.toLowerCase().includes(keyword) ||
        ticket.ticket_number.toString().includes(keyword)
      );
    });
  }, [tickets, search]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-14 rounded-2xl bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-200" />
        <div className="h-24 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader title="Support Tickets" subtitle="Manage student complaints and support requests." />

      <div className="card">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by Ticket Number, Student or Subject..." />
      </div>

      {filteredTickets.length === 0 && (
        <div className="card">
          <EmptyState icon={MessageSquareText} title="No Tickets Found" description="There are currently no support requests." />
        </div>
      )}

      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Link key={ticket.id} to={`/admin/tickets/${ticket.id}`}>
            <div className="card card-hover hover:border-red-200 cursor-pointer">
              <div className="flex justify-between items-start gap-3">
                <div className="space-y-2 min-w-0">
                  <p className="text-sm text-gray-400 font-semibold">
                    Ticket #{ticket.ticket_number.toString().padStart(4, "0")}
                  </p>

                  <h2 className="text-lg font-semibold text-slate-900">{ticket.subject}</h2>

                  <div className="text-sm text-gray-500 space-y-1">
                    <p><span className="font-medium">Student:</span> {ticket.students.full_name}</p>
                    <p><span className="font-medium">Student Code:</span> {ticket.students.student_code}</p>
                    <p><span className="font-medium">Room:</span> {ticket.students.room_number} • {ticket.students.hostel_block}</p>
                    <p><span className="font-medium">Submitted:</span> {new Date(ticket.created_at).toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                  <StatusBadge status={ticket.status} />
                  <ChevronRight className="w-5 h-5 text-gray-400" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
