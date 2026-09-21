import { getDatabase } from "./db.js";
import { hashPassword } from "./password.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "POST requests only."
        });
    }

    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (name.length < 2) {
        return res.status(422).json({
            success: false,
            message: "Please enter your full name."
        });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(422).json({
            success: false,
            message: "Please enter a valid email address."
        });
    }

    if (password.length < 6) {
        return res.status(422).json({
            success: false,
            message: "Password must be at least 6 characters."
        });
    }

    try {
        const database = getDatabase();

        const [existing] = await database.execute(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email]
        );

        if (existing.length) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists."
            });
        }

        const hashedPassword = await hashPassword(password);

        await database.execute(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );

        return res.status(201).json({
            success: true,
            message: "Account created successfully."
        });

    } catch (error) {
        console.error("Registration failed:", error);

        return res.status(500).json({
            success: false,
            message: "Account service is temporarily unavailable."
        });
    }
}