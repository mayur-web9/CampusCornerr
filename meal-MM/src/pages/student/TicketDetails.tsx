import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import {
  getTicket,
  getTicketMessages,
  replyToTicket,
} from "../../lib/ticketService";

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
  message: string;
  created_at: string;
}

export default function TicketDetails() {
  const { id } = useParams<{ id: string }>();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  async function loadTicket() {
    try {
      setLoading(true);

      const [ticketData, messageData] = await Promise.all([
        getTicket(id!),
        getTicketMessages(id!),
      ]);

      setTicket(ticketData);
      setMessages(messageData || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load ticket.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();

    if (!reply.trim()) {
      toast.error("Please enter your reply.");
      return;
    }

    try {
      setSending(true);

      await replyToTicket(id!, reply);

      const updated = await getTicketMessages(id!);

      setMessages(updated || []);

      setReply("");

      toast.success("Reply sent successfully.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="card">
        <EmptyState icon={MessageCircle} title="Ticket Not Found" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-gray-400">TKT-{ticket.ticket_number.toString().padStart(4, "0")}</p>
            <h1 className="text-2xl font-bold mt-2 text-slate-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 mt-2">{new Date(ticket.created_at).toLocaleString("en-IN")}</p>
          </div>
          <StatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="card">
        <h2 className="font-bold text-lg mb-5 text-slate-900">Conversation</h2>

        <div className="space-y-4">
          <div className="bg-red-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-red-700 mb-2">You</p>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender_type === "student" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xl rounded-2xl p-4 ${msg.sender_type === "student" ? "bg-red-600 text-white" : "bg-gray-100"}`}>
                <p className={`text-xs font-semibold mb-2 ${msg.sender_type === "student" ? "text-red-100" : "text-gray-500"}`}>
                  {msg.sender_type === "student" ? "You" : "Admin"}
                </p>
                <p className="whitespace-pre-wrap">{msg.message}</p>
                <p className={`text-xs mt-3 ${msg.sender_type === "student" ? "text-red-100" : "text-gray-400"}`}>
                  {new Date(msg.created_at).toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {ticket.status !== "Resolved" && (
        <div className="card">
          <form onSubmit={handleReply} className="space-y-4">
            <h2 className="font-bold text-slate-900">Send Reply</h2>

            <textarea
              rows={5}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="input-field resize-none"
              placeholder="Write your reply..."
            />

            <button type="submit" disabled={sending} className="btn-primary flex items-center gap-2">
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Reply
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
