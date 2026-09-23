export interface IBudgetRange {
  /** English label shown on the contact form. */
  name: string;
  /** Bangla label. */
  nameBn?: string;
  /** Stable value submitted with the enquiry (e.g. "under1", "2to5"). */
  value: string;
  /** Sort order — lower first. */
  order?: number;
  isActive?: boolean;
}
