import { useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { toast } from "sonner";

import { createTicket } from "../../lib/ticketService";
import PageHeader from "../../components/ui/PageHeader";
import SectionCard from "../../components/ui/SectionCard";

export default function RaiseTicket() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Please enter a subject.");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter your message.");
      return;
    }

    if (subject.trim().length < 5) {
      toast.error("Subject should be at least 5 characters.");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("Please describe your issue in a little more detail.");
      return;
    }

    try {
      setSubmitting(true);

      await createTicket(subject.trim(), message.trim());

      toast.success("Support ticket submitted successfully.");

      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message || "Failed to submit support ticket."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Support"
        subtitle="Facing any issue? Submit your request or complaint and our hostel administration will respond as soon as possible."
      />

      <SectionCard>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="w-5 h-5 text-red-600" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Raise a Ticket</h2>
            <p className="text-sm text-gray-500">Fill in the details below.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              maxLength={100}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Example: Food served cold today"
              className="input-field"
            />
            <div className="text-right mt-1 text-xs text-gray-400">{subject.length}/100</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
            <textarea
              rows={6}
              value={message}
              maxLength={1000}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your issue in detail..."
              className="input-field resize-none"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">Be as specific as possible.</span>
              <span className="text-xs text-gray-400">{message.length}/1000</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </SectionCard>

      {/* Info Card */}
      <div className="card bg-blue-50/60 border border-blue-100">
        <h3 className="font-semibold text-blue-900">Need Assistance?</h3>
        <ul className="mt-3 text-sm text-blue-800 space-y-2 list-disc pl-5">
          <li>Describe your issue clearly.</li>
          <li>Include relevant meal or hostel details.</li>
          <li>Our staff will review and reply through the ticket.</li>
          <li>You can check the reply from the "My Tickets" page.</li>
        </ul>
      </div>
    </div>
  );
}
