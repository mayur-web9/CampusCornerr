import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import {
  getTicket,
  getTicketMessages,
  adminReply,
  updateTicketStatus,
} from "../../lib/ticketService";

import Conversation from "../../components/tickets/Conversation";
import ReplyBox from "../../components/tickets/ReplyBox";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";

interface Ticket {
  id: string;
  ticket_number: number;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  created_at: string;
}

interface TicketMessage {
  id: string;
  sender_type: "student" | "admin";
  sender_id: string;
  message: string;
  created_at: string;
}

export default function AdminTicketDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [ticket, setTicket] = useState<Ticket | null>(null);

  const [messages, setMessages] = useState<TicketMessage[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  async function loadTicket() {
    try {
      setLoading(true);

      const ticketData = await getTicket(id!);

      const messageData = await getTicketMessages(id!);

      setTicket(ticketData);

      setMessages(messageData || []);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load ticket.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(message: string) {
    try {
      await adminReply(id!, message);

      toast.success("Reply sent.");

      loadTicket();
    } catch (err) {
      console.error(err);

      toast.error("Unable to send reply.");
    }
  }

  async function handleStatusChange(
    status: "Open" | "In Progress" | "Resolved"
  ) {
    try {
      await updateTicketStatus(id!, status);

      toast.success("Status updated.");

      loadTicket();
    } catch (err) {
      console.error(err);

      toast.error("Unable to update status.");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-2xl" />
        <div className="h-64 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="card">
        <EmptyState icon={ArrowLeft} title="Ticket not found" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => navigate("/admin/tickets")}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        Back to Tickets
      </button>

      <div className="card">
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-sm text-gray-400">Ticket #{ticket.ticket_number.toString().padStart(4, "0")}</p>
            <h1 className="text-2xl font-bold mt-1 text-slate-900">{ticket.subject}</h1>
            <p className="text-gray-500 mt-3">{ticket.message}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>

        <div className="mt-6">
          <label htmlFor="ticket-status" className="text-sm font-medium text-slate-700">
            Ticket Status
          </label>
          <select
            id="ticket-status"
            value={ticket.status}
            onChange={(e) =>
              handleStatusChange(
                e.target.value as "Open" | "In Progress" | "Resolved"
              )
            }
            className="input-field mt-2 max-w-xs"
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      <div className="card">
        <Conversation initialMessage={ticket.message} messages={messages} />
      </div>

      {ticket.status !== "Resolved" && (
        <div className="card">
          <ReplyBox onSend={handleReply} />
        </div>
      )}
    </div>
  );
}
