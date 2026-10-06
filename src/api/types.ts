/** Shapes returned by the NeoWell API — see neowell-backend/docs/04-api-endpoint-specification.md. */
import type { RiskLevel } from '@/theme';

export type Role = 'CAREGIVER' | 'CLINICIAN' | 'ADMIN';
export type Sex = 'FEMALE' | 'MALE';
export type CareStatus = 'AT_HOME' | 'IN_HOSPITAL' | 'KANGAROO_CARE';
export type CheckType = 'ROUTINE' | 'UNWELL';
export type Medium = 'CHAT' | 'AUDIO' | 'VIDEO';
export const COMPLAINTS = [
  'FEVER',
  'FEELS_COLD',
  'CRYING_A_LOT',
  'NOT_CRYING_OR_WEAK',
  'NOT_FEEDING',
  'BREATHING_PROBLEM',
  'TWITCHING_OR_FITS',
  'VOMITING',
  'DIARRHEA',
  'YELLOW_SKIN_OR_EYES',
  'SKIN_COLOUR_CHANGE',
  'CORD_PROBLEM',
  'OTHER',
] as const;
export type Complaint = (typeof COMPLAINTS)[number];

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface Me {
  id: string;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  locale: 'en' | 'fr';
  region: string | null;
  city: string | null;
  consentDataCollectionAt: string | null;
  consentClinicianShareAt: string | null;
  consentRecordingAt: string | null;
  profileComplete: boolean;
}

export interface Baby {
  id: string;
  givenName: string | null;
  displayName: string;
  sex: Sex | null;
  dateOfBirth: string;
  ageDays: number;
  correctedAgeDays: number | null;
  gestationalAgeWeeks: number | null;
  termStatus: string | null;
  birthWeightGrams: number | null;
  birthWeightCategory: string | null;
  birthLengthCm: number | null;
  birthHeadCircumferenceCm: number | null;
  birthFacility: { id: string; name: string } | null;
  birthFacilityName: string | null;
  careStatus: CareStatus;
  dischargeDate: string | null;
  riskFactors: { code: string }[];
  isHighRisk: boolean;
  needsName: boolean;
}

export interface NewBaby {
  sex: Sex;
  dateOfBirth: string;
  gestationalAgeWeeks: number;
  birthWeightGrams: number;
  birthLengthCm: number;
  birthHeadCircumferenceCm: number;
  givenName?: string;
  birthFacilityId?: string;
  birthFacilityName?: string;
  careStatus?: CareStatus;
  dischargeDate?: string;
}

export interface CheckSchedule {
  checksPerDay: 1 | 2 | 3;
  reminderTimes: string[];
  checksLast24h: number;
  checksDue: number;
  paused: boolean;
  pausedReason: CareStatus | null;
  pendingRecheck: { id: string; dueAt: string; reason: string } | null;
}

export interface Measurement {
  id: string;
  measuredAt: string;
  weightGrams: number | null;
  lengthCm: number | null;
  headCircumferenceCm: number | null;
  source: 'BIRTH' | 'HOSPITAL' | 'CLINIC' | 'HOME';
  notes: string | null;
}

export interface MeasurementInput {
  measuredAt: string;
  weightGrams?: number;
  lengthCm?: number;
  headCircumferenceCm?: number;
  source: 'HOSPITAL' | 'CLINIC' | 'HOME';
  notes?: string;
}

export type GrowthFlag = 'NORMAL' | 'OUT_OF_RANGE' | 'FAR_OUT_OF_RANGE';
export interface GrowthItem {
  value: number;
  unit: 'g' | 'cm';
  measuredAt: string;
  ageDays: number | null;
  zScore: number | null;
  flag: GrowthFlag | null;
}
export interface Growth {
  latest: { weight: GrowthItem | null; length: GrowthItem | null; headCircumference: GrowthItem | null };
  flags: { code: string; level: 'YELLOW' | 'RED'; direction?: 'LOW' | 'HIGH' }[];
  usesCorrectedAge: boolean;
}

export type QuestionKind = 'TEMPERATURE' | 'COUNTER' | 'SINGLE' | 'BOOLEAN' | 'BREATH_COUNTER';
export interface PlanQuestion {
  id: string;
  field: string;
  kind: QuestionKind;
  required: boolean;
  label: string;
  help?: string;
  options?: { value: string; label: string; danger: boolean }[];
  min?: number;
  max?: number;
  defaultValue?: number;
  showIf?: { field: string; notBetween?: [number, number] };
}
export interface CheckPlan {
  type: CheckType;
  complaints: Complaint[];
  questions: PlanQuestion[];
}

export interface Finding {
  code: string;
  level: 'YELLOW' | 'RED';
}

export interface Observation {
  id: string;
  checkType: CheckType;
  complaints: Complaint[];
  observedAt: string;
  temperatureC: number | null;
  respiratoryRate: number | null;
  riskLevel: RiskLevel;
  findings: Finding[];
  actions: string[];
  photoUrl: string | null;
}

export interface Assessment {
  level: RiskLevel;
  findings: Finding[];
  actions: string[];
  engineVersion: string;
  emergencyNumbers: string[];
}

/** Answers keyed by observation field, as the API expects them. */
export type Answers = Record<string, string | number | boolean | undefined>;
export type ObservationInput = {
  temperatureC: number;
  checkType?: CheckType;
  complaints?: Complaint[];
  complaintText?: string;
  clientRef?: string;
  recheckOfId?: string;
  voiceNoteId?: string;
  observedAt?: string;
  [field: string]: string | number | boolean | Complaint[] | undefined;
};

export interface CheckResult {
  observation: Observation;
  assessment: Assessment;
  recheck: { id: string; dueAt: string } | null;
}

export interface FacilityDepartment {
  id: string;
  service: string;
  name: string;
  phone: string;
}

export interface Facility {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  mainPhone: string | null;
  hours: string | null;
  services: string[];
  distanceKm: number;
  departments: FacilityDepartment[];
}

export interface FacilityHit {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
}

export interface Clinician {
  id: string;
  displayName: string;
  title: string;
  specialties: string[];
  bio: string | null;
  currentFacility: string | null;
  yearsExperience: number | null;
  photoUrl: string | null;
  verified: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  media: Partial<Record<Medium, number>>;
  availableNow: boolean;
  availability?: { dayOfWeek: number; startMinute: number; endMinute: number }[];
}

export type VerificationStatus = 'PENDING_DOCUMENTS' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

export interface MyClinicianProfile extends Clinician {
  firstName: string | null;
  lastName: string | null;
  licenseNumber: string;
  offersChat: boolean;
  offersAudio: boolean;
  offersVideo: boolean;
  feeChatXaf: number;
  feeAudioXaf: number;
  feeVideoXaf: number;
  availableNowUntil: string | null;
  payoutProvider: 'MTN_MOMO' | 'ORANGE_MONEY' | null;
  payoutPhone: string | null;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  documents: { id: string; type: string; originalName: string; uploadedAt: string }[];
  availability: { dayOfWeek: number; startMinute: number; endMinute: number }[];
  missingDocuments: string[];
  missingForReview: string[];
}

export interface ClinicianInput {
  firstName: string;
  lastName: string;
  title?: string;
  licenseNumber: string;
  specialties: string[];
  bio?: string;
  currentFacility?: string;
  yearsExperience?: number;
  offersChat: boolean;
  offersAudio: boolean;
  offersVideo: boolean;
  feeChatXaf: number;
  feeAudioXaf: number;
  feeVideoXaf: number;
  payoutProvider?: 'MTN_MOMO' | 'ORANGE_MONEY';
  payoutPhone?: string;
}

export type ConsultationStatus =
  | 'AWAITING_PAYMENT'
  | 'REQUESTED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'NO_SHOW';

export interface DrugChartItem {
  id: string;
  drugName: string;
  dose: string;
  route: string;
  timesOfDay: string[];
  durationDays: number;
  instructions: string | null;
  doseLogs?: { scheduledFor: string; status: 'GIVEN' | 'SKIPPED'; loggedAt: string }[];
}

export interface DrugChart {
  id: string;
  babyId: string;
  consultationId: string | null;
  prescriber?: string | null;
  startDate: string;
  endsAt?: string;
  active?: boolean;
  items: DrugChartItem[];
}

export interface Referral {
  id: string;
  code: string;
  urgency: 'EMERGENCY' | 'SAME_DAY' | 'ROUTINE';
  reason: string;
  facilityName: string;
  facility: { id: string; name: string; mainPhone: string | null; departments: FacilityDepartment[] } | null;
}

export interface Consultation {
  id: string;
  status: ConsultationStatus;
  medium: Medium;
  timing: 'SCHEDULED' | 'ASAP';
  scheduledAt: string;
  acceptDeadline: string | null;
  reason: string | null;
  feeXaf: number;
  paymentStatus: 'UNPAID' | 'PENDING' | 'PAID' | 'REFUND_PENDING' | 'REFUNDED' | 'FAILED';
  commissionXaf?: number;
  clinicianEarningXaf?: number;
  baby: {
    id: string;
    displayName: string;
    givenName: string | null;
    ageDays: number;
    sex: Sex | null;
    isHighRisk: boolean;
    riskFactors: { code: string }[];
  };
  clinician: Clinician;
  caregiver?: { firstName: string | null; lastName: string | null };
  observationId: string | null;
  preConsultChecklist: Record<string, boolean> | null;
  previsitSummary?: Summary | null;
  referral: Referral | null;
  drugChart: DrugChart | null;
  review: { rating: number; comment: string | null } | null;
  clinicianNotes: string | null;
  diagnosisSummary: string | null;
  cancelReason: string | null;
  chatOpen: boolean;
  canJoinCall: boolean;
  unreadCount: number;
}

export interface BookInput {
  babyId: string;
  clinicianId: string;
  medium: Medium;
  timing: 'SCHEDULED' | 'ASAP';
  scheduledAt?: string;
  reason?: string;
  observationId?: string;
  preConsultChecklist?: Record<string, boolean>;
}

export interface Message {
  id: string;
  kind: 'TEXT' | 'IMAGE' | 'REPORT' | 'SYSTEM';
  body: string | null;
  imageUrl: string | null;
  senderRole: Role | null;
  mine: boolean;
  contactMasked: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface Summary {
  generatedAt: string;
  period: { days: number; from: string; to: string };
  baby: Baby;
  growth: Growth;
  totals: { checks: number; expectedChecks: number; unwellChecks: number; green: number; yellow: number; red: number };
  latestRiskLevel: RiskLevel | null;
  temperature: { min: number; max: number; latest: number } | null;
  findingCounts: Record<string, number>;
  observations: {
    id: string;
    observedAt: string;
    checkType: CheckType;
    complaints: Complaint[];
    riskLevel: RiskLevel;
    temperatureC: number | null;
    respiratoryRate: number | null;
    findings: string[];
    notes: string | null;
  }[];
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: { url?: string } | null;
  readAt: string | null;
  createdAt: string;
}

export interface Earnings {
  pendingXaf: number;
  paidXaf: number;
  completedCount: number;
  payouts: { id: string; amountXaf: number; status: 'PENDING' | 'PAID'; periodEnd: string; paidAt: string | null }[];
}

/** A file picked on the device, ready for multipart upload. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}
