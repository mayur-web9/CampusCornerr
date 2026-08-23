import { useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { CreatePollData } from "../../lib/types";
import Modal from "../ui/Modal";

interface PollFormProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePollData) => Promise<void>;
}

export default function PollForm({
  open,
  loading = false,
  onClose,
  onSubmit,
}: PollFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [options, setOptions] = useState([
    "",
    "",
  ]);

  const [showResults, setShowResults] = useState(true);

  const [expiresAt, setExpiresAt] = useState("");

  function addOption() {
    if (options.length >= 10) {
      toast.error("Maximum 10 options allowed");
      return;
    }

    setOptions([...options, ""]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      toast.error("Minimum 2 options required");
      return;
    }

    setOptions(options.filter((_, i) => i !== index));
  }

  function updateOption(index: number, value: string) {
    const copy = [...options];
    copy[index] = value;
    setOptions(copy);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error("Enter poll title");
      return;
    }

    const cleanedOptions = options
      .map((o) => o.trim())
      .filter(Boolean);

    if (cleanedOptions.length < 2) {
      toast.error("Minimum 2 options required");
      return;
    }

    try {
      await onSubmit({
        title,
        description,
        options: cleanedOptions,
        show_results: showResults,
        expires_at: expiresAt || null,
      });

      toast.success("Poll created");

      setTitle("");
      setDescription("");
      setOptions(["", ""]);
      setShowResults(true);
      setExpiresAt("");

      onClose();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create poll");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create New Poll"
      maxWidth="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Create Poll
          </button>
        </>
      }
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-500 -mt-2">Students can vote once per poll.</p>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Poll Title</label>
          <input
            className="input-field"
            placeholder="Example: Which dessert should we serve?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            rows={3}
            className="input-field resize-none"
            placeholder="Optional description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Options */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">Poll Options</label>
            <button onClick={addOption} className="text-red-600 text-sm font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" />
              Add Option
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="input-field flex-1"
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                />
                <button onClick={() => removeOption(index)} className="p-2 rounded-xl hover:bg-red-50 text-red-500" aria-label={`Remove option ${index + 1}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Expiry Date</label>
          <input
            type="datetime-local"
            className="input-field"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
        </div>

        {/* Show Results */}
        <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
          <div>
            <h4 className="font-medium text-slate-900">Show Results</h4>
            <p className="text-sm text-gray-500">Allow students to view poll results.</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showResults}
              onChange={() => setShowResults(!showResults)}
            />
            <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-red-600 transition-colors duration-200"></div>
            <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-5"></div>
          </label>
        </div>
      </div>
    </Modal>
  );
}
