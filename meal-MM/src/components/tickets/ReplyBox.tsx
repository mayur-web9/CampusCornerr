import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ReplyBoxProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
}

export default function ReplyBox({
  onSend,
  disabled = false,
}: ReplyBoxProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter your reply.");
      return;
    }

    try {
      setSending(true);

      await onSend(message.trim());

      setMessage("");

      toast.success("Reply sent successfully.");
    } catch (error: any) {
      console.error(error);

      toast.error(
        error?.message || "Failed to send reply."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-bold text-slate-900">Send Reply</h2>

      <textarea
        rows={5}
        value={message}
        disabled={disabled || sending}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write your reply..."
        className="input-field resize-none disabled:bg-gray-100"
      />

      <button
        type="submit"
        disabled={disabled || sending}
        className="btn-primary flex items-center gap-2"
      >
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
  );
}
