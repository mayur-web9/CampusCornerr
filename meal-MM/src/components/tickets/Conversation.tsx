interface TicketMessage {
  id: string;
  sender_type: "student" | "admin";
  message: string;
  created_at: string;
}

interface ConversationProps {
  initialMessage: string;
  messages: TicketMessage[];
}

export default function Conversation({
  initialMessage,
  messages,
}: ConversationProps) {
  return (
    <div className="space-y-4">
      {/* Original Ticket */}
      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
        <p className="text-xs font-semibold text-red-700 mb-2">Student</p>
        <p className="text-gray-700 whitespace-pre-wrap">{initialMessage}</p>
      </div>

      {/* Replies */}
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.sender_type === "student" ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
              msg.sender_type === "student" ? "bg-red-600 text-white" : "bg-gray-100 text-slate-800"
            }`}
          >
            <p className={`text-xs font-semibold mb-2 ${msg.sender_type === "student" ? "text-red-100" : "text-gray-500"}`}>
              {msg.sender_type === "student" ? "Student" : "Admin"}
            </p>
            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
            <p className={`text-xs mt-3 ${msg.sender_type === "student" ? "text-red-100" : "text-gray-400"}`}>
              {new Date(msg.created_at).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
