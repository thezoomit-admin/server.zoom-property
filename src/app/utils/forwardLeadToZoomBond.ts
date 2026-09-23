import config from "../config";

export type ZoomBondLeadPayload = {
  /** Maps to Bond `fullName`. */
  name: string;
  phone: string;
  email?: string | null;
  /** Project / campaign label shown on the landing form. */
  project?: string | null;
  note?: string | null;
};

/**
 * Forward a Zoom Property enquiry to Zoom Bond CRM public intake.
 * POST {ZOOM_BOND_CRM_URL}/api/public/leads
 *
 * Body (exact):
 * { fullName, phone, email?, project?, note? }
 *
 * Fire-and-forget — never throws into the caller. Bond downtime must not
 * block the property site form.
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
  } = { fullName, phone };

  const email = String(lead.email || "").trim();
  if (email) body.email = email;

  const project = String(lead.project || "").trim();
  if (project) body.project = project;

  const note = String(lead.note || "").trim();
  if (note) body.note = note;

  const url = `${base}/api/public/leads`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
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
