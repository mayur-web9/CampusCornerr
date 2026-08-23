import { supabase } from "./supabase";

/* ===========================================================
   TYPES
=========================================================== */

export interface Ticket {
  id: string;
  ticket_number: number;
  student_id: string;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: "student" | "admin";
  sender_id: string;
  message: string;
  created_at: string;
}

/* ===========================================================
   STUDENT FUNCTIONS
=========================================================== */

async function getCurrentStudentId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("students")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  return data.id;
}

async function getCurrentEmployeeId(): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("User not authenticated.");
  }

  const { data, error } = await supabase
    .from("staff")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (error) throw error;

  return data.id;
}

/**
 * Create Ticket
 */
export async function createTicket(subject: string, message: string) {
  const studentId = await getCurrentStudentId();

  const { data, error } = await supabase
    .from("tickets")
    .insert([
      {
        student_id: studentId,
        subject,
        message,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Student Ticket List
 */
export async function getMyTickets() {
  const studentId = await getCurrentStudentId();

  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data;
}

/**
 * Ticket Details
 */
export async function getTicket(ticketId: string) {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", ticketId)
    .single();

  if (error) throw error;

  return data;
}

/**
 * Ticket Conversation
 */
export async function getTicketMessages(ticketId: string) {
  const { data, error } = await supabase
    .from("ticket_messages")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data;
}

/**
 * Student Reply
 */
export async function replyToTicket(ticketId: string, message: string) {
  const studentId = await getCurrentStudentId();

  const { error } = await supabase
    .from("ticket_messages")
    .insert([
      {
        ticket_id: ticketId,
        sender_type: "student",
        sender_id: studentId,
        message,
      },
    ]);

  if (error) throw error;
}

/* ===========================================================
   ADMIN FUNCTIONS
=========================================================== */

/**
 * Get All Tickets
 */
export async function getAllTickets() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("Current Auth User:", user);

  const { data, error } = await supabase
    .from("tickets")
    .select(`
      *,
      students!tickets_student_id_fkey (
        full_name,
        student_code,
        room_number,
        hostel_block
      )
    `)
    .order("created_at", { ascending: false });

  console.log("Tickets:", data);
  console.log("Error:", error);

  if (error) throw error;

  return data;
}

/**
 * Admin Reply
 */
export async function adminReply(ticketId: string, message: string) {
  const employeeId = await getCurrentEmployeeId();

  const { error } = await supabase
    .from("ticket_messages")
    .insert([
      {
        ticket_id: ticketId,
        sender_type: "admin",
     sender_id: employeeId,
        message,
      },
    ]);

  if (error) throw error;
}

/**
 * Update Ticket Status
 */
export async function updateTicketStatus(
  ticketId: string,
  status: "Open" | "In Progress" | "Resolved"
) {
  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) throw error;
}