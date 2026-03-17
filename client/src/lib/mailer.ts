import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface InviteEmailPayload {
  to: string;
  inviterName: string;
  workspaceName: string;
  projectName: string | null;
  role: string;
  inviteUrl: string;
  hasAccount: boolean;
}

export async function sendInviteEmail(payload: InviteEmailPayload) {
  const { to, inviterName, workspaceName, projectName, role, inviteUrl, hasAccount } = payload;

  const actionLabel = hasAccount ? "Accept Invitation" : "Sign Up & Accept";

  const subtitle = projectName
    ? `You've been invited to join <strong>${projectName}</strong> in <strong>${workspaceName}</strong> as <strong>${role}</strong>.`
    : `You've been invited to join the workspace <strong>${workspaceName}</strong> as <strong>${role}</strong>.`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>You're invited</title>
</head>

<body style="margin:0;padding:0;background:#F7F7F5;font-family:'Segoe UI',sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F5;padding:40px 16px;">
<tr>
<td align="center">

<table width="100%" cellpadding="0" cellspacing="0"
style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid rgba(0,0,0,0.07);box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<!-- HEADER -->
<tr>
<td style="background:#0D0D0D;padding:26px 36px;">

<table cellpadding="0" cellspacing="0">
<tr>

<td style="vertical-align:middle;padding-right:12px;">

<!-- Nudge Logo -->
<svg width="140" height="36" viewBox="0 0 220 56" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g>
    <rect x="8" y="8" width="16" height="16" rx="8" fill="#36C5F0"/>
    <rect x="8" y="26" width="16" height="16" rx="4" fill="#36C5F0" opacity="0.4"/>
    <rect x="26" y="8" width="16" height="16" rx="4" fill="#2EB67D" opacity="0.4"/>
    <rect x="26" y="26" width="16" height="16" rx="8" fill="#2EB67D"/>
  </g>

  <text
    x="56"
    y="37"
    font-family="Sora, sans-serif"
    font-weight="800"
    font-size="28"
    fill="white"
    letter-spacing="-1"
  >
    nudge
  </text>
</svg>

</td>

<td>
<p style="margin:0;color:rgba(255,255,255,0.7);font-size:13px;">
${inviterName} invited you
</p>
</td>

</tr>
</table>

</td>
</tr>

<!-- BODY -->
<tr>
<td style="padding:32px 36px;">

<p style="margin:0 0 20px;font-size:14px;color:#374151;line-height:1.7;">
${subtitle}
</p>

<table cellpadding="0" cellspacing="0"
style="background:#F7F7F5;border-radius:12px;padding:16px 20px;margin-bottom:28px;width:100%;">

<tr>

<td>
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">
Workspace
</p>
<p style="margin:0;font-size:14px;font-weight:800;color:#111827;">
${workspaceName}
</p>
</td>

${projectName ? `
<td style="padding-left:24px;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">
Project
</p>
<p style="margin:0;font-size:14px;font-weight:800;color:#111827;">
${projectName}
</p>
</td>` : ""}

<td style="padding-left:24px;">
<p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">
Role
</p>
<p style="margin:0;font-size:14px;font-weight:800;color:#111827;text-transform:capitalize;">
${role}
</p>
</td>

</tr>
</table>

<!-- BUTTON -->
<a href="${inviteUrl}"
style="display:inline-block;background:#0D0D0D;color:#ffffff;text-decoration:none;font-size:13.5px;font-weight:800;padding:13px 28px;border-radius:12px;letter-spacing:-0.2px;">
${actionLabel} →
</a>

<p style="margin:24px 0 0;font-size:11.5px;color:#9CA3AF;">
This invitation expires in 7 days. If you didn't expect this email you can ignore it.
</p>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="padding:16px 36px;border-top:1px solid rgba(0,0,0,0.05);">

<p style="margin:0;font-size:11px;color:#9CA3AF;">
Or copy this link:
</p>

<p style="margin:6px 0 0;font-size:11px;color:#374151;word-break:break-all;">
${inviteUrl}
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? "Nudge"}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `${inviterName} invited you to ${projectName ?? workspaceName}`,
    html,
  });
}