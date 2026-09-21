import { getDatabase } from "./db.js";
import { json, postOnly, requestBody } from "./http.js";
import { verifyPassword } from "./password.js";

export default {
  async fetch(request) {
    if (!postOnly(request)) return json({ success: false, message: "POST requests only." }, 405);
    const data = await requestBody(request);
    const email = String(data?.email ?? "").trim().toLowerCase();
    const password = String(data?.password ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email) || !password) return json({ success: false, message: "Email and password are required." }, 422);

    try {
      const [users] = await getDatabase().execute("SELECT id, name, email, password FROM users WHERE email = ? LIMIT 1", [email]);
      const user = users[0];
      if (!user || !(await verifyPassword(password, user.password))) return json({ success: false, message: "Incorrect email or password." }, 401);
      return json({ success: true, user: { id: Number(user.id), name: user.name, email: user.email } });
    } catch (error) {
      console.error("Login failed", error);
      return json({ success: false, message: "Account service is temporarily unavailable." }, 500);
    }
  },
};
