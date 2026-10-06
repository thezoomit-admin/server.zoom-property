import config from "../config";

export type ZoomBondLeadPayload = {
  /** Maps to Bond `fullName`. */
  name: string;
  phone: string;
  email?: string | null;
  /** Project / campaign label shown on the landing form. */
  project?: string | null;
  note?: string | null;
  /** Form's Address/City → Bond persona `address`. */
  address?: string | null;
  /** Form's Occupation (free text) → Bond persona profile `occupation`. */
  occupation?: string | null;
};

/**
 * Forward a Zoom Property **lead form** submission to Bond CRM.
 * POST {ZOOM_BOND_CRM_URL}/api/public/leads
 *
 * Only called when contact payload has `createLead: true`
 * (home hero, landing enquire, site CTA) — not for contact-page inquiries.
 *
 * Body (exact): { fullName, phone, email?, project?, note?, address?, occupation? }
 *
 * Fire-and-forget — never throws into the caller.
 */
export async function forwardLeadToZoomBond(
  lead: ZoomBondLeadPayload,
): Promise<void> {
  const base = String(config.zoom_bond_crm_url || "")
    .trim()
    .replace(/\/+$/, "");
  if (!base) {
    console.warn(
      "[zoomBond] ZOOM_BOND_CRM_URL is empty — skip CRM lead forward",
    );
    return;
  }

  const fullName = String(lead.name || "").trim();
  const phone = String(lead.phone || "").trim();
  if (!fullName || phone.length < 7) {
    console.warn("[zoomBond] skip forward — fullName/phone incomplete");
    return;
  }

  const body: {
    fullName: string;
    phone: string;
    email?: string;
    project?: string;
    note?: string;
    address?: string;
    occupation?: string;
  } = { fullName, phone };

  const email = String(lead.email || "").trim();
  if (email) body.email = email;

  const project = String(lead.project || "").trim();
  if (project) body.project = project;

  const note = String(lead.note || "").trim();
  if (note) body.note = note;

  const address = String(lead.address || "").trim();
  if (address) body.address = address;

  const occupation = String(lead.occupation || "").trim();
  if (occupation) body.occupation = occupation;

  const url = `${base}/api/public/leads`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Every visitor's lead leaves from this one server; the secret lets
        // Bond skip its per-IP limit (we already limit each visitor).
        ...(config.zoom_bond_lead_secret
          ? { "X-Internal-Secret": config.zoom_bond_lead_secret }
          : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(
        `[zoomBond] lead forward failed ${res.status} ${url}:`,
        text.slice(0, 400),
      );
      return;
    }

    console.info(
      `[zoomBond] lead forwarded → ${url} (${fullName} / ${phone})`,
    );
  } catch (err) {
    console.error("[zoomBond] lead forward error:", err);
  } finally {
    clearTimeout(timer);
  }
}

export default forwardLeadToZoomBond;
