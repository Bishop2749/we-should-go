export interface Medication {
  name: string
  dosage?: string
  frequency?: string
  prescriber?: string
  startDate?: string
  status: 'active' | 'inactive'
}

export interface Appointment {
  title: string
  provider?: string
  location?: string
  date: string
  status: string
}

export interface LabResult {
  name: string
  value: string
  unit?: string
  referenceRange?: string
  date: string
  flag?: 'normal' | 'high' | 'low' | 'critical'
}

export interface HealthCondition {
  name: string
  onsetDate?: string
  status: 'active' | 'resolved' | 'inactive'
}
