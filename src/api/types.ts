/** Shapes returned by the NeoWell backend (neowell-backend). Keep in sync with its DTOs. */
import type { RiskLevel } from '@/theme';

export type Role = 'CAREGIVER' | 'CLINICIAN' | 'ADMIN';
export type Sex = 'FEMALE' | 'MALE' | 'UNKNOWN';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface Me {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  locale: 'en' | 'fr';
  consentDataCollectionAt: string | null;
  consentClinicianShareAt: string | null;
  consentRecordingAt: string | null;
}

export interface Baby {
  id: string;
  name: string;
  sex: Sex;
  dateOfBirth: string;
  birthWeightGrams: number | null;
  gestationalAgeWeeks: number | null;
  isHighRisk: boolean;
}

export interface CheckSchedule {
  checksPerDay: 1 | 2 | 3;
  reminderTimes: string[];
  checksLast24h: number;
  checksDue: number;
}

export interface Finding {
  code: string;
  level: 'YELLOW' | 'RED';
}

export interface Observation {
  id: string;
  observedAt: string;
  temperatureC: number | null;
  riskLevel: RiskLevel;
  findings: Finding[];
  actions: string[];
}

export interface Assessment {
  level: RiskLevel;
  findings: Finding[];
  actions: string[];
  engineVersion: string;
  emergencyNumbers: string[];
}

export interface ObservationInput {
  temperatureC?: number;
  feedingCount24h?: number;
  feedingQuality?: 'GOOD' | 'REDUCED' | 'UNABLE';
  stoolPattern?: 'NORMAL' | 'REDUCED' | 'NONE' | 'DIARRHEA' | 'BLOODY';
  skinColor?: 'NORMAL' | 'PALE' | 'YELLOW' | 'BLUE' | 'MOTTLED';
  cry?: 'NORMAL' | 'WEAK' | 'HIGH_PITCHED' | 'INCONSOLABLE';
  activity?: 'NORMAL' | 'REDUCED' | 'LETHARGIC';
  breathing?: 'NORMAL' | 'FAST' | 'DIFFICULT';
  jaundice?: 'NONE' | 'FACE_CHEST' | 'PALMS_SOLES';
  cordStatus?: 'NORMAL' | 'RED_OR_DISCHARGE' | 'SPREADING_REDNESS_OR_PUS';
  convulsions?: boolean;
  notes?: string;
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
