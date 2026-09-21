# Tripeso Reward

Registration and login use the `tripeso_reward` MySQL database through the PHP API in `api/`. Passwords are stored securely in the `users.password` column using PHP's `password_hash`; the browser never stores a password.

## Laragon setup

1. Start **Apache** and **MySQL** in Laragon.
2. In phpMyAdmin, select **Import** and import [`api/schema.sql`](api/schema.sql). This creates the `tripeso_reward` database and `users` table.
3. Copy the project's `api` folder to `C:\laragon\www\tripeso_reward\api`.

   The endpoint should then be `http://localhost/tripeso_reward/api/register.php`. If your Laragon project folder has a different name, create `.env.local` in this project:

   ```env
   VITE_API_URL=http://localhost/YOUR_FOLDER_NAME/api
   ```

4. Laragon normally uses `root` with an empty MySQL password. If yours differs, edit the connection values at the top of [`api/config.php`](api/config.php).
5. Run the React app with `npm.cmd run dev`, then register a new account. Confirm the new record in phpMyAdmin → `tripeso_reward` → `users`.

Points and wallet values remain browser-only demo data. Accounts and login credentials are MySQL-backed.
