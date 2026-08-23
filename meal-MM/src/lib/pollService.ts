import { supabase } from './supabase';
import {
  Poll,
  PollOption,
  PollResult,
  CreatePollData,
  VoteData,
} from './types';

export const pollService = {
  async createPoll(
    data: CreatePollData,
    createdBy: string
  ): Promise<Poll> {
    const { data: poll, error } = await supabase
      .from('polls')
      .insert({
        title: data.title,
        description: data.description ?? null,
        created_by: createdBy,
        expires_at: data.expires_at ?? null,
        show_results: data.show_results,
        status: 'active',
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    const options = data.options.map((option, index) => ({
      poll_id: poll.id,
      option_text: option,
      display_order: index + 1,
    }));

    const { error: optionError } = await supabase
      .from('poll_options')
      .insert(options);

    if (optionError) throw optionError;

    return poll as Poll;
  },

  async getActivePolls(): Promise<Poll[]> {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data as Poll[];
  },

  async getPollOptions(
    pollId: string
  ): Promise<PollOption[]> {
    const { data, error } = await supabase
      .from('poll_options')
      .select('*')
      .eq('poll_id', pollId)
      .order('display_order');

    if (error) throw error;

    return data as PollOption[];
  },

  async vote(
    data: VoteData,
    studentId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('poll_votes')
      .insert({
        poll_id: data.poll_id,
        option_id: data.option_id,
        student_id: studentId,
      });

    if (error) throw error;
  },

  async hasVoted(
    pollId: string,
    studentId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('poll_votes')
      .select('id')
      .eq('poll_id', pollId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) throw error;

    return !!data;
  },

  // 🚀 Optimized RPC version
  async getPollResults(
    pollId: string
  ): Promise<PollResult[]> {
    const { data, error } = await supabase.rpc(
      'get_poll_results',
      {
        p_poll_id: pollId,
      }
    );

    if (error) throw error;

    return (data ?? []) as PollResult[];
  },

  async closePoll(
    pollId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('polls')
      .update({
        status: 'closed',
        active: false,
      })
      .eq('id', pollId);

    if (error) throw error;
  },

  async deletePoll(
    pollId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('polls')
      .delete()
      .eq('id', pollId);

    if (error) throw error;
  },
};