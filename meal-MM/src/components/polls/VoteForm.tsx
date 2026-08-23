import { useEffect, useState } from "react";
import { CheckCircle2, Vote, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PollOption } from "../../lib/types";
import { usePolls } from "../../hooks/usePolls";

interface VoteFormProps {
  pollId: string;
  studentId: string;
  onVoteSuccess?: () => void;
}

export default function VoteForm({
  pollId,
  studentId,
  onVoteSuccess,
}: VoteFormProps) {
  const {
    getOptions,
    vote,
    hasVoted,
  } = usePolls();

  const [options, setOptions] = useState<PollOption[]>([]);
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);

      const [pollOptions, voted] = await Promise.all([
        getOptions(pollId),
        hasVoted(pollId, studentId),
      ]);

      setOptions(pollOptions);
      setAlreadyVoted(voted);
    } catch (error) {
      toast.error("Failed to load poll.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (!selectedOption) {
      toast.error("Please select an option.");
      return;
    }

    try {
      setSubmitting(true);

      await vote(
        pollId,
        selectedOption,
        studentId
      );

      toast.success("Vote submitted successfully!");

      setAlreadyVoted(true);

      onVoteSuccess?.();
    } catch (error: any) {
      toast.error(
        error.message ?? "Unable to submit vote."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-40 mb-5" />

        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-12 bg-gray-200 rounded-xl mb-3"
          />
        ))}

        <div className="h-11 bg-gray-200 rounded-xl mt-4" />
      </div>
    );
  }

  if (alreadyVoted) {
    return (
      <div className="card text-center py-10">

        <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />

        <h2 className="text-xl font-bold text-gray-900">
          Vote Submitted
        </h2>

        <p className="text-gray-500 mt-2">
          You have already participated in this poll.
        </p>

      </div>
    );
  }

  return (
    <div className="card">

      <div className="flex items-center gap-3 mb-6">

        <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">

          <Vote className="w-6 h-6 text-red-600" />

        </div>

        <div>

          <h2 className="font-bold text-lg">
            Cast Your Vote
          </h2>

          <p className="text-sm text-gray-500">
            Select one option below.
          </p>

        </div>

      </div>

      <div className="space-y-3">

        {options.map((option) => (
          <label
            key={option.id}
            className={`block cursor-pointer rounded-xl border p-4 transition-all ${
              selectedOption === option.id
                ? "border-red-600 bg-red-50"
                : "border-gray-200 hover:border-red-300"
            }`}
          >

            <div className="flex items-center gap-3">

              <input
                type="radio"
                checked={selectedOption === option.id}
                onChange={() =>
                  setSelectedOption(option.id)
                }
                className="w-5 h-5 accent-red-600"
              />

              <span className="font-medium text-gray-800">
                {option.option_text}
              </span>

            </div>

          </label>
        ))}

      </div>

      <button
        onClick={handleVote}
        disabled={!selectedOption || submitting}
        className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Vote className="w-4 h-4" />
            Submit Vote
          </>
        )}
      </button>

    </div>
  );
}