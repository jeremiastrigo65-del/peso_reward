# Tripeso Reward

Registration and login use MySQL through Vercel serverless functions in `api/`. Passwords are hashed on the server; the browser never stores a password.

## Deploy accounts and login

Vercel cannot access the MySQL database on your computer (`localhost`). Use any hosted MySQL provider, then add its connection details to Vercel. The `api/register.js` and `api/login.js` files deploy automatically as `/api/register` and `/api/login`.

1. Create a hosted MySQL database and database user. In the provider's phpMyAdmin or SQL console, import [`api/schema.sql`](api/schema.sql). If it prefixes database names, update the first two lines of the SQL to the exact database name first.
2. In Vercel, open your project, then go to **Settings → Environment Variables**. Add these variables for **Production** (and Preview too if you want preview deployments to support login):

   ```text
   DB_HOST=your-mysql-host
   DB_PORT=3306
   DB_NAME=your-database-name
   DB_USER=your-database-user
   DB_PASSWORD=your-secret-password
   ```

   Do not add `VITE_` to these names: database variables must remain server-only. Vercel applies new variables only to a new deployment.
3. Push these changes to the Git repository connected to Vercel, or redeploy from the Vercel dashboard. No `VITE_API_URL` is necessary because the frontend and functions use the same domain.
4. Open the live site and register a fresh account. It should create a row in the hosted database's `users` table, then log in successfully.

For local Laragon PHP testing, the old PHP endpoints remain available through the Vite proxy. The Vercel deployment uses the JavaScript functions instead.

## Laragon setup

1. Start **Apache** and **MySQL** in Laragon.
2. In phpMyAdmin, select **Import** and import [`api/schema.sql`](api/schema.sql). This creates the `tripeso_reward` database and `users` table.
3. Copy the project's `api` folder to `C:\laragon\www\tripeso_reward\api`.

   The endpoint should then be `http://localhost/tripeso_reward/api/register.php`. If your Laragon project folder has a different name, create `.env.local` in this project:

   ```env
   VITE_API_URL=http://localhost/YOUR_FOLDER_NAME/api
   ```

4. Laragon normally uses `root` with an empty MySQL password. If yours differs, create `api/config.local.php` from [`api/config.local.php.example`](api/config.local.php.example) and edit it.
5. Run the React app with `npm.cmd run dev`, then register a new account. Confirm the new record in phpMyAdmin → `tripeso_reward` → `users`.

Points and wallet values remain browser-only demo data. Accounts and login credentials are MySQL-backed.
