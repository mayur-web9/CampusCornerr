import { useEffect, useState } from "react";
import { Vote, Plus, Eye, EyeOff, Trash2, Lock, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

import PollForm from "../../components/polls/PollForm";
import PollResults from "../../components/polls/PollResults";

import { usePolls } from "../../hooks/usePolls";
import { useAuth } from "../../contexts/AuthContext";

import { PollResult, CreatePollData } from "../../lib/types";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";
import EmptyState from "../../components/ui/EmptyState";
import StatusBadge from "../../components/ui/StatusBadge";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

type PollAction = { type: "close" | "delete"; pollId: string };

export default function AdminPolls() {
  const { profile } = useAuth();

  const {
    polls,
    loading,
    createPoll,
    refresh,
    getResults,
    closePoll,
    deletePoll,
  } = usePolls();

  const [showForm, setShowForm] = useState(false);

  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);

  const [resultsLoading, setResultsLoading] = useState(false);

  const [results, setResults] = useState<Record<string, PollResult[]>>({});

  const [pollAction, setPollAction] = useState<PollAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreatePoll(data: CreatePollData) {
    try {
      if (!profile) return;

      await createPoll(data, profile.id);

      toast.success("Poll created successfully");

      setShowForm(false);

      refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create poll");
    }
  }

  async function handleShowResults(pollId: string) {
    try {
      if (selectedPoll === pollId) {
        setSelectedPoll(null);
        return;
      }

      setResultsLoading(true);

      const pollResults = await getResults(pollId);

      setResults((prev) => ({
        ...prev,
        [pollId]: pollResults,
      }));

      setSelectedPoll(pollId);
    } catch (err: any) {
      toast.error(err.message ?? "Unable to load poll results");
    } finally {
      setResultsLoading(false);
    }
  }

  async function handleConfirmAction() {
    if (!pollAction) return;
    setActionLoading(true);
    try {
      if (pollAction.type === "close") {
        await closePoll(pollAction.pollId);
        toast.success("Poll closed");
      } else {
        await deletePoll(pollAction.pollId);
        toast.success("Poll deleted");
      }
      refresh();
    } catch (err: any) {
      toast.error(err.message ?? `Unable to ${pollAction.type} poll`);
    } finally {
      setActionLoading(false);
      setPollAction(null);
    }
  }

  const activePolls = polls.filter((p) => p.status === "active");
  const closedPolls = polls.filter((p) => p.status === "closed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Poll Management"
        subtitle="Create and manage student polls"
        actions={
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Poll
          </button>
        }
      />

      {/* Statistics */}
      <div className="grid md:grid-cols-3 gap-4">
        <StatCard label="Active Polls" value={activePolls.length} icon={Vote} iconBg="bg-green-50" iconColor="text-green-600" />
        <StatCard label="Closed Polls" value={closedPolls.length} icon={Lock} iconBg="bg-red-50" iconColor="text-red-600" />
        <StatCard label="Total Polls" value={polls.length} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
      </div>

      {/* Poll List */}
      <div className="space-y-5">
        {polls.length === 0 && (
          <div className="card">
            <EmptyState
              icon={Vote}
              title="No Polls Yet"
              description="Create your first poll for students."
              action={<button onClick={() => setShowForm(true)} className="btn-primary">Create Poll</button>}
            />
          </div>
        )}

        {polls.length > 0 &&
          polls.map((poll) => {
            const pollResults = results[poll.id] ?? [];
            const totalVotes = pollResults.reduce((sum, item) => sum + item.votes, 0);

            return (
              <div key={poll.id} className="card">
                {/* Poll Header */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900">{poll.title}</h2>
                      <StatusBadge status={poll.status} />
                    </div>

                    {poll.description && <p className="text-gray-600 mt-2">{poll.description}</p>}

                    <div className="flex flex-wrap gap-5 mt-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" aria-hidden="true" />
                        {new Date(poll.created_at).toLocaleDateString("en-IN")}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        {totalVotes} Vote{totalVotes !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleShowResults(poll.id)} className="btn-secondary flex items-center gap-2">
                      {selectedPoll === poll.id ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Hide Results
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4" />
                          View Results
                        </>
                      )}
                    </button>

                    {poll.status === "active" && (
                      <button onClick={() => setPollAction({ type: "close", pollId: poll.id })} className="btn-warning flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Close Poll
                      </button>
                    )}

                    <button onClick={() => setPollAction({ type: "delete", pollId: poll.id })} className="btn-danger flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Results */}
                {selectedPoll === poll.id && (
                  <div className="mt-8">
                    <PollResults loading={resultsLoading} results={pollResults} totalVotes={totalVotes} />
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Create Poll Modal */}
      <PollForm open={showForm} loading={loading} onClose={() => setShowForm(false)} onSubmit={handleCreatePoll} />

      <ConfirmDialog
        open={pollAction !== null}
        title={pollAction?.type === "close" ? "Close Poll" : "Delete Poll"}
        description={
          pollAction?.type === "close"
            ? "Students won't be able to vote anymore once this poll is closed."
            : <>This will permanently delete this poll. <span className="font-semibold text-red-600">This action cannot be undone.</span></>
        }
        confirmLabel={pollAction?.type === "close" ? "Close Poll" : "Delete"}
        danger={pollAction?.type === "delete"}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={() => setPollAction(null)}
      />
    </div>
  );
}
