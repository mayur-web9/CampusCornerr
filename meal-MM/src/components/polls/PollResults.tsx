import {
  BarChart3,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { PollResult } from "../../lib/types";

interface PollResultsProps {
  results: PollResult[];
  totalVotes: number;
  loading?: boolean;
}

export default function PollResults({
  results,
  totalVotes,
  loading = false,
}: PollResultsProps) {
  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gray-200" />
          <div>
            <div className="h-5 w-36 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>

        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-5">
            <div className="flex justify-between mb-2">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-4 w-12 bg-gray-200 rounded" />
            </div>

            <div className="h-3 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <CheckCircle2 className="mx-auto w-14 h-14 text-gray-200 mb-4" />

          <h3 className="font-semibold text-gray-800">
            No Votes Yet
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            Students haven't voted in this poll yet.
          </p>
        </div>
      </div>
    );
  }

  const highestVotes = Math.max(...results.map((r) => r.votes));

  return (
    <div className="card">

      {/* Header */}

      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">

            <BarChart3 className="w-6 h-6 text-red-600" />

          </div>

          <div>

            <h2 className="font-bold text-lg text-slate-900">
              Poll Results
            </h2>

            <p className="text-sm text-gray-500">
              Live voting statistics
            </p>

          </div>

        </div>

        <div className="bg-red-50 text-red-600 font-semibold text-sm px-3 py-1 rounded-full">
          {totalVotes} Vote{totalVotes !== 1 ? "s" : ""}
        </div>

      </div>

      {/* Results */}

      <div className="space-y-5">

        {results.map((result) => {
          const winner =
            highestVotes > 0 &&
            result.votes === highestVotes;

          return (
            <div
              key={result.option_id}
              className={`rounded-xl border p-4 transition-all ${
                winner
                  ? "border-red-200 bg-red-50"
                  : "border-gray-100 bg-white"
              }`}
            >

              <div className="flex justify-between items-start mb-3">

                <div>

                  <div className="flex items-center gap-2">

                    <h3 className="font-semibold text-slate-900">
                      {result.option_text}
                    </h3>

                    {winner && (
                      <span className="flex items-center gap-1 text-xs font-semibold bg-orange-50 text-orange-700 px-2 py-1 rounded-full ring-1 ring-inset ring-orange-200">

                        <Trophy className="w-3 h-3" />

                        Leading

                      </span>
                    )}

                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {result.votes} vote
                    {result.votes !== 1 ? "s" : ""}
                  </p>

                </div>

                <div className="text-right">

                  <div className="text-2xl font-bold text-red-600">
                    {result.percentage}%
                  </div>

                </div>

              </div>

              {/* Progress */}

              <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">

                <div
                  className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${result.percentage}%`,
                  }}
                />

              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}