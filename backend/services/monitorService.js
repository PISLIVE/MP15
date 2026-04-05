const nodemailer = require("nodemailer");
const axios      = require("axios");
const cron       = require("node-cron");
const { supabase } = require("../config/database");

// ─── Email Transporter ───────────────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Send Breach Alert Email ─────────────────────────────────────────────────
const sendBreachAlert = async (toEmail, watchedEmail, newBreaches, totalCount) => {
  const transporter = createTransporter();

  const breachListHtml = newBreaches
    .slice(0, 5)
    .map(
      (b) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;">
          <strong style="color:#1e293b;">${b.name || "Unknown Source"}</strong>
          ${b.date ? `<span style="color:#94a3b8;font-size:12px;margin-left:8px;">${b.date}</span>` : ""}
          ${b.description ? `<br><span style="color:#64748b;font-size:13px;">${b.description}</span>` : ""}
        </td>
      </tr>`
    )
    .join("");

  const moreText =
    newBreaches.length > 5
      ? `<p style="color:#64748b;font-size:13px;margin-top:12px;">…and ${newBreaches.length - 5} more breaches.</p>`
      : "";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 32px 24px;">
      <div style="font-size:28px;margin-bottom:6px;">🚨</div>
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">New Breach Detected</h1>
      <p style="color:#93c5fd;margin:4px 0 0;font-size:14px;">Digital Footprint Analyzer Alert</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#334155;font-size:15px;margin:0 0 20px;">
        Your monitored email <strong style="color:#1e3a5f;">${watchedEmail}</strong> has appeared in
        <strong style="color:#dc2626;">${newBreaches.length} new data breach${newBreaches.length > 1 ? "es" : ""}</strong>.
        Total known breaches: <strong>${totalCount}</strong>.
      </p>

      <!-- Breach table -->
      <div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;margin-bottom:20px;">
        <div style="background:#fef2f2;padding:10px 16px;border-bottom:1px solid #fecaca;">
          <span style="color:#dc2626;font-weight:600;font-size:13px;">⚠️ New Breaches Found</span>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${breachListHtml}
        </table>
        ${moreText}
      </div>

      <!-- Actions -->
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="color:#0369a1;font-weight:600;font-size:14px;margin:0 0 8px;">✅ Recommended Actions</p>
        <ul style="color:#0c4a6e;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
          <li>Change your password for any service listed above</li>
          <li>Enable two-factor authentication (2FA)</li>
          <li>Check if you reused this password on other sites</li>
          <li>Consider using a password manager</li>
        </ul>
      </div>

      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/monitor"
         style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
        View Full Report →
      </a>
    </div>

    <!-- Footer -->
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="color:#94a3b8;font-size:12px;margin:0;">
        You're receiving this because you're monitoring <strong>${watchedEmail}</strong> on Digital Footprint Analyzer.
        <br>Breach data powered by <a href="https://xposedornot.com" style="color:#94a3b8;">XposedOrNot</a>.
      </p>
    </div>
  </div>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Digital Footprint Analyzer" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `🚨 New Breach Alert — ${watchedEmail} found in ${newBreaches.length} new breach${newBreaches.length > 1 ? "es" : ""}`,
    html,
  });

  console.log(`[Monitor] Alert sent to ${toEmail} for ${watchedEmail}`);
};

// ─── Check One Monitored Email ────────────────────────────────────────────────
const checkOneEmail = async (record) => {
  const { id, email, known_breach_count, known_breach_names, user_email } = record;

  try {
    // Use the SAME endpoint as breachService.js (breach-analytics, not check-email)
    const res = await axios.get(
      `https://api.xposedornot.com/v1/breach-analytics`,
      {
        params: { email },
        headers: { Accept: "application/json", "User-Agent": "DigitalFootprintAnalyzer/1.0" },
        timeout: 15000,
      }
    );

    const data = res.data;

    // "Not found" or no breaches = clean email
    const breachDetails = (data?.Error === "Not found" || !data?.ExposedBreaches)
      ? []
      : (data.ExposedBreaches?.breaches_details || []);

    const totalCount  = breachDetails.length;
    const breachNames = breachDetails.map((b) => b.breach || b.domain || "Unknown");

    const knownNames = Array.isArray(known_breach_names) ? known_breach_names : [];
    const newOnes    = breachDetails.filter((b) => {
      const name = b.breach || b.domain || "Unknown";
      return !knownNames.includes(name);
    });

    if (newOnes.length > 0 && user_email) {
      const formatted = newOnes.map((b) => ({
        name: b.breach || "Unknown",
        date: b.xposed_date ? String(b.xposed_date) : null,
        description: b.details || null,
      }));
      await sendBreachAlert(user_email, email, formatted, totalCount);
    }

    // Update DB record
    await supabase
      .from("monitored_emails")
      .update({
        last_checked: new Date().toISOString(),
        known_breach_count: totalCount,
        known_breach_names: breachNames,
        status: totalCount > 0 ? "breached" : "safe",
      })
      .eq("id", id);

    console.log(`[Monitor] ${email} — ${totalCount} breaches, ${newOnes.length} new`);
  } catch (err) {
    if (err?.response?.status === 404) {
      // 404 = email not in any breach = safe
      await supabase
        .from("monitored_emails")
        .update({ last_checked: new Date().toISOString(), status: "safe", known_breach_count: 0 })
        .eq("id", id);
      console.log(`[Monitor] ${email} — safe (404 from XposedOrNot)`);
      return;
    }
    console.error(`[Monitor] Error checking ${email}:`, err.message);
    await supabase
      .from("monitored_emails")
      .update({ last_checked: new Date().toISOString() })
      .eq("id", id);
  }
};


// ─── Run Full Monitor Check ──────────────────────────────────────────────────
const checkAllMonitoredEmails = async () => {
  console.log("[Monitor] Starting daily breach check...");

  // Join with auth.users to get the user's email for alerts
  const { data: records, error } = await supabase
    .from("monitored_emails")
    .select("id, email, known_breach_count, known_breach_names, user_id");

  if (error) {
    console.error("[Monitor] Failed to fetch monitored emails:", error.message);
    return;
  }

  if (!records || records.length === 0) {
    console.log("[Monitor] No emails to check.");
    return;
  }

  // Fetch owner emails from Supabase Auth
  for (const record of records) {
    try {
      const { data: userData } = await supabase.auth.admin.getUserById(record.user_id);
      record.user_email = userData?.user?.email || null;
    } catch {
      record.user_email = null;
    }
    await checkOneEmail(record);
    // Small delay to avoid rate limiting XposedOrNot
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log(`[Monitor] Done. Checked ${records.length} emails.`);
};

// ─── Start Cron Job (runs daily at 8:00 AM) ──────────────────────────────────
const startMonitorCron = () => {
  // Every day at 08:00 AM server time
  cron.schedule("0 8 * * *", () => {
    checkAllMonitoredEmails().catch(console.error);
  });
  console.log("[Monitor] Breach monitor cron started — runs daily at 08:00 AM");
};

module.exports = { startMonitorCron, checkAllMonitoredEmails, checkOneEmail };
