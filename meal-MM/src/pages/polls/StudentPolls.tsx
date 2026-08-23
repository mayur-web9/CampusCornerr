import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { usePolls } from "../../hooks/usePolls";

import VoteForm from "../../components/polls/VoteForm";
import PollResults from "../../components/polls/PollResults";

import { Poll, PollResult } from "../../lib/types";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";

export default function StudentPolls() {
  const { profile } = useAuth();

  const { polls, loading, getResults } = usePolls();

  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);

  const [results, setResults] = useState<PollResult[]>([]);

  const [loadingResults, setLoadingResults] = useState(false);

  useEffect(() => {
    if (polls.length > 0 && !selectedPoll) {
      setSelectedPoll(polls[0]);
    }
  }, [polls]);

  useEffect(() => {
    if (selectedPoll && selectedPoll.show_results) {
      loadResults(selectedPoll.id);
    }
  }, [selectedPoll]);

  async function loadResults(pollId: string) {
    try {
      setLoadingResults(true);

      const data = await getResults(pollId);

      setResults(data);
    } finally {
      setLoadingResults(false);
    }
  }

  function totalVotes() {
    return results.reduce((sum, item) => sum + item.votes, 0);
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-gray-200" />
        <div className="h-64 rounded-2xl bg-gray-200" />
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="max-w-3xl mx-auto card">
        <EmptyState icon={ClipboardList} title="No Active Polls" description="There are currently no active polls." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Polls & Voting" subtitle="Participate in active hostel polls." />

      {/* Poll List */}
      <div className="grid gap-3">
        {polls.map((poll) => (
          <button
            key={poll.id}
            onClick={() => setSelectedPoll(poll)}
            className={`text-left rounded-xl border p-4 transition-all duration-200 ${
              selectedPoll?.id === poll.id ? "border-red-500 bg-red-50" : "border-gray-200 hover:border-red-300"
            }`}
          >
            <h3 className="font-semibold text-slate-900">{poll.title}</h3>
            {poll.description && <p className="text-sm text-gray-500 mt-1">{poll.description}</p>}
          </button>
        ))}
      </div>

      {/* Selected Poll */}
      {selectedPoll && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-bold text-slate-900">{selectedPoll.title}</h2>
            {selectedPoll.description && <p className="text-gray-600 mt-2">{selectedPoll.description}</p>}
          </div>

          <VoteForm
            pollId={selectedPoll.id}
            studentId={(profile as any).id}
            onVoteSuccess={() => {
              if (selectedPoll.show_results) {
                loadResults(selectedPoll.id);
              }
            }}
          />

          {selectedPoll.show_results && (
            <PollResults results={results} totalVotes={totalVotes()} loading={loadingResults} />
          )}
        </div>
      )}
    </div>
  );
}
