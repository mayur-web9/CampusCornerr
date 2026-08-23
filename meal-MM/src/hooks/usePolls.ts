import { useEffect, useState } from 'react';
import { pollService } from '../lib/pollService';
import {
  Poll,
  PollOption,
  PollResult,
  CreatePollData
} from '../lib/types';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadPolls() {
    try {
      setLoading(true);

      const data = await pollService.getActivePolls();

      setPolls(data);
    } finally {
      setLoading(false);
    }
  }

  async function createPoll(
    data: CreatePollData,
    adminId: string
  ) {
    await pollService.createPoll(data, adminId);

    await loadPolls();
  }

  async function getOptions(
    pollId: string
  ): Promise<PollOption[]> {
    return pollService.getPollOptions(pollId);
  }

  async function vote(
    pollId: string,
    optionId: string,
    studentId: string
  ) {
    await pollService.vote(
      {
        poll_id: pollId,
        option_id: optionId,
      },
      studentId
    );
  }

  async function hasVoted(
    pollId: string,
    studentId: string
  ) {
    return pollService.hasVoted(
      pollId,
      studentId
    );
  }

  async function getResults(
    pollId: string
  ): Promise<PollResult[]> {
    return pollService.getPollResults(pollId);
  }

  async function closePoll(pollId: string) {
    await pollService.closePoll(pollId);

    await loadPolls();
  }

  async function deletePoll(pollId: string) {
    await pollService.deletePoll(pollId);

    await loadPolls();
  }

  useEffect(() => {
    loadPolls();
  }, []);

  return {
    polls,

    loading,

    refresh: loadPolls,

    createPoll,

    getOptions,

    vote,

    hasVoted,

    getResults,

    closePoll,

    deletePoll,
  };
}