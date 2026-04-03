export interface PipelineJobData {
  searchId: string;
  userId: string | null;
  company: string;
  role: string;
  location: string | null;
}

export interface GmailSendJobData {
  outreachId: string;
  userId: string;
  contactId: string;
  to: string;
  subject: string;
  body: string;
}

export type ProgressStage =
  | "contacts_found"
  | "emails_guessed"
  | "research_done"
  | "drafts_ready";

export interface ProgressEvent {
  stage: ProgressStage;
  timestamp: string;
}

export type { PipelineResponse } from "./agents";
