export function createWelcomeEmailTemplate(name, clientURL) {
  return `
  <div style="font-family:Segoe UI,Tahoma,sans-serif;line-height:1.6;color:#243447;max-width:600px;margin:0 auto;padding:20px;background:#f7fafc;">
    <div style="background:linear-gradient(to right,#36d1dc,#5b86e5);padding:24px;border-radius:14px 14px 0 0;text-align:center;color:#fff;">
      <h2 style="margin:0;">Welcome to Chatify</h2>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 14px 14px;">
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account is ready. Start chatting with your contacts in real-time.</p>
      <p style="margin:24px 0;">
        <a href="${clientURL}" style="background:#0ea5e9;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;">Open Chatify</a>
      </p>
      <p style="font-size:12px;color:#718096;">Have fun messaging.</p>
    </div>
  </div>
  `;
}
