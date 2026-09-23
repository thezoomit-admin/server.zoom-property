export interface IContactMessage {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type?: string;
  enquiry?: string;
  area?: string;
  subArea?: string;
  budget?: string;
  source?: string;
  /**
   * When true, also forward to Zoom Bond as a CRM lead.
   * Only home / landing / site-CTA lead forms set this — contact inquiries do not.
   */
  createLead?: boolean;
}

export interface IQuotationRequest {
  name: string;
  email: string;
  phone?: string;
  site_url?: string;
  company_name?: string;
  delivery_time?: string;
  start_date?: string;
  service: string;
  budget: string;
  message: string;
  help?: string;
}
