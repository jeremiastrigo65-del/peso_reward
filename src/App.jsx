
import { useState } from "react";
import "./App.css";

const STORAGE_KEY = "tripeso_reward_session";
const POINTS_PER_PESO = 100;
// During development, /api is proxied to Laragon by vite.config.js.
// Set VITE_API_URL only when the API is hosted somewhere else.
const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const activities = [
  {
    id: "checkin",
    icon: "📅",
    title: "Daily Check-in",
    description: "Check in once every day",
    points: 10
  },
  {
    id: "video",
    icon: "▶️",
    title: "Watch a Sponsored Video",
    description: "Watch a short promotional video",
    points: 25
  },
  {
    id: "survey",
    icon: "📝",
    title: "Complete a Survey",
    description: "Answer a quick demo survey",
    points: 50
  },
  {
    id: "refer",
    icon: "👥",
    title: "Refer a Friend",
    description: "Invite a friend to join",
    points: 100
  }
];

function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const updateField = (field) => (e) => {
    setForm((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const saveUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
  };

  const request = async (endpoint, body) => {
    try {
      const response = await fetch(`${API_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      let data = null;
      try {
        data = JSON.parse(responseText);
      } catch {
        // The Vite development server returns index.html with HTTP 200 when it
        // was started before the proxy configuration was added.
      }
      if (!data) {
        if (response.status === 200 && responseText.includes('<!doctype html>')) {
          throw new Error("Vite is serving the app instead of the API. Stop Vite and run npm.cmd run dev again.");
        }
        throw new Error(`The API returned an invalid response (HTTP ${response.status}).`);
      }
      return data;
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        throw new Error("Cannot reach the API. Start Apache in Laragon, then restart Vite.");
      }
      throw requestError;
    }
  };

  const register = async (e) => {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (!form.email.trim()) return setError("Please enter your email.");
    if (form.password.length < 6) return setError("Password should be at least 6 characters.");

    try {
      const data = await request("register.php", {
        name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password
      });
      if (!data.success) return setError(data.message || "Could not create the account.");
      setForm({ name: "", email: "", password: "" });
      setNotice("Account created successfully! Please log in.");
      setTimeout(() => { setNotice(""); setPage("login"); }, 1200);
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.message || "Could not contact the server.");
    }
  };

  const login = async (e) => {
  e.preventDefault();
  setError("");

  if (!form.email || !form.password) {
    setError("Please enter your email and password.");
    return;
  }

  try {
    const data = await request("login.php", {
      email: form.email.trim().toLowerCase(), password: form.password
    });

    if (!data.success) {
      setError(data.message);
      return;
    }

    const loggedInUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,

      points: 0,
      wallet: 0,
      transactions: []
    };

    saveUser(loggedInUser);

    setForm({
      name: "",
      email: "",
      password: ""
    });

    setPage("dashboard");

  } catch (requestError) {
    console.error(requestError);
    setError(requestError.message || "Could not contact the server.");
  }
};

  const alreadyCompletedToday = (activityId) => {
    const today = new Date().toDateString();

    return (user.transactions || []).some(
      (transaction) =>
        transaction.activityId === activityId &&
        new Date(transaction.timestamp).toDateString() === today
    );
  };

  const earnPoints = (activity) => {
    if (activity.id === "checkin" && alreadyCompletedToday("checkin")) {
      setNotice("You already claimed today's check-in.");
      return;
    }

    const transaction = {
      id: Date.now(),
      title: activity.title,
      points: activity.points,
      type: "earn",
      activityId: activity.id,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString()
    };

    const updatedUser = {
      ...user,
      points: user.points + activity.points,
      transactions: [
        transaction,
        ...(user.transactions || [])
      ]
    };

    saveUser(updatedUser);

    setNotice(`+${activity.points} points added to your account!`);

    setTimeout(() => setNotice(""), 3000);
  };

  const redeemPoints = () => {
    if (user.points < POINTS_PER_PESO) {
      setNotice("You need at least 100 points to redeem ₱1.00.");
      return;
    }

    const pesoValue = Math.floor(user.points / POINTS_PER_PESO);
    const pointsUsed = pesoValue * POINTS_PER_PESO;

    const transaction = {
      id: Date.now(),
      title: "Points Redeemed",
      points: pointsUsed,
      type: "redeem",
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleString()
    };

    const updatedUser = {
      ...user,
      points: user.points - pointsUsed,
      wallet: user.wallet + pesoValue,
      transactions: [
        transaction,
        ...(user.transactions || [])
      ]
    };

    saveUser(updatedUser);

    setNotice(`₱${pesoValue.toFixed(2)} added to your Balance wallet.`);

    setTimeout(() => setNotice(""), 3000);
  };

  const logout = () => {
    setUser(null);
    setPage("home");
  };

  const pointsValue = user
    ? user.points / POINTS_PER_PESO
    : 0;

  return (
    <div className="app">

      {/* NAVIGATION */}
      <nav className="navbar">
        <div
          className="logo"
          onClick={() => setPage(user ? "dashboard" : "home")}
        >
          Tripeso<span>Reward</span>
        </div>

        {!user && (
          <div className="nav-buttons">
            <button onClick={() => setPage("login")}>
              Log In
            </button>

            <button
              className="primary"
              onClick={() => setPage("register")}
            >
              Sign Up
            </button>
          </div>
        )}

        {user && (
          <button
            className="nav-dashboard"
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
        )}
      </nav>

      {/* NOTIFICATION */}
      {notice && (
        <div className="notice">
          <span>✓</span>
          {notice}
        </div>
      )}

      {/* HOME */}
      {page === "home" && (
        <main className="hero">

          <div className="hero-copy">

            <div className="live-badge">
              <span></span>
          TOP 10 MOST TRUSTED COMPANY IN PHILIPPINES
            </div>

            <h1>
              Turn your everyday
              <strong> actions into rewards.</strong>
            </h1>

            <p className="hero-body">
              Earn points by completing simple activities,
              track your progress, and convert your points
              into simulated cash rewards.
            </p>

            <div className="hero-actions">
              <button
                className="big-button"
                onClick={() => setPage("register")}
              >
                Start Earning
                <span>→</span>
              </button>

              <button
                className="text-button"
                onClick={() => setPage("login")}
              >
                I already have an account
              </button>
            </div>

            <div className="trust-row">
              <div>
                <strong>100 pts</strong>
                <span>= ₱1.00</span>
              </div>

              <div>
                <strong>4+</strong>
                <span>earning activities</span>
              </div>

              <div>
                <strong>100%</strong>
                <span>who browse</span>
              </div>
            </div>

          </div>

          <div className="hero-card">

            <div className="phone">

              <div className="phone-top">
                <span>TripesoReward</span>
                <span>•••</span>
              </div>

              <div className="balance-card">
                <p>Available rewards</p>
                <h2>₱25.00</h2>
                <span>2,500 points</span>

                <div className="mini-progress">
                  <div style={{ width: "72%" }}></div>
                </div>

                <small>750 pts until next ₱10 reward</small>
              </div>

              <div className="mini-title">
                Earn more points
              </div>

              <div className="mini-activity">
                <div>📅</div>
                <div>
                  <strong>Daily Check-in</strong>
                  <span>+10 points</span>
                </div>
              </div>

              <div className="mini-activity">
                <div>▶️</div>
                <div>
                  <strong>Watch Video</strong>
                  <span>+25 points</span>
                </div>
              </div>

              <div className="mini-activity">
                <div>📝</div>
                <div>
                  <strong>Complete Survey</strong>
                  <span>+50 points</span>
                </div>
              </div>

            </div>

          </div>

        </main>
      )}

      {/* REGISTER */}
      {page === "register" && (
        <div className="auth-wrapper">

          <div className="card">

            <div className="card-icon">🎁</div>

            <p className="card-kicker">
              CREATE ACCOUNT
            </p>

            <h2>Start earning rewards</h2>

            <p className="card-sub">
              Create your demo account and begin
              collecting points.
            </p>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <form onSubmit={register}>

              <label>Full name</label>

              <input
                placeholder="Juan Dela Cruz"
                required
                value={form.name}
                onChange={updateField("name")}
              />

              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={updateField("email")}
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="At least 6 characters"
                required
                minLength={6}
                value={form.password}
                onChange={updateField("password")}
              />

              <button className="big-button">
                Create Account →
              </button>

            </form>

            <p className="switch">
              Already have an account?
              <button onClick={() => setPage("login")}>
                Log in
              </button>
            </p>

          </div>

        </div>
      )}

      {/* LOGIN */}
      {page === "login" && (
        <div className="auth-wrapper">

          <div className="card">

            <div className="card-icon">👋</div>

            <p className="card-kicker">
              WELCOME BACK
            </p>

            <h2>Log in to your rewards</h2>

            <p className="card-sub">
              Continue earning where you left off.
            </p>

            {error && (
              <div className="form-error">
                {error}
              </div>
            )}

            <form onSubmit={login}>

              <label>Email address</label>

              <input
                type="email"
                placeholder="you@example.com"
                required
                value={form.email}
                onChange={updateField("email")}
              />

              <label>Password</label>

              <input
                type="password"
                placeholder="Your password"
                required
                value={form.password}
                onChange={updateField("password")}
              />

              <button className="big-button">
                Log In →
              </button>

            </form>

            <p className="switch">
              Don't have an account?
              <button onClick={() => setPage("register")}>
                Sign up
              </button>
            </p>

          </div>

        </div>
      )}

      {/* DASHBOARD */}
      {page === "dashboard" && user && (
        <main className="dashboard">

          <section className="dashboard-header">

            <div>
              <p className="card-kicker">
                YOUR REWARDS
              </p>

              <h1>
                Welcome back, {user.name.split(" ")[0]} 👋
              </h1>

              <p>
                Keep completing activities to grow your
                rewards balance.
              </p>
            </div>

            <button
              className="logout"
              onClick={logout}
            >
              Log Out
            </button>

          </section>

          {/* BALANCE CARDS */}
          <section className="stats">

            <div className="stat-card main-stat">

              <div className="stat-top">
                <span>POINT BALANCE</span>
                <span className="coin">★</span>
              </div>

              <h2>
                {user.points.toLocaleString()}
              </h2>

              <p>
                ≈ ₱{pointsValue.toFixed(2)}
              </p>

              <div className="progress-container">

                <div className="progress-bar">
                  <div
                    style={{
                      width: `${Math.min(
                        (user.points % 1000) / 10,
                        100
                      )}%`
                    }}
                  ></div>
                </div>

                <span>
                  {1000 - (user.points % 1000)} pts
                  until next ₱10
                </span>

              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>YOUR BALANCE WALLET</span>
                <span>₱</span>
              </div>

              <h2>
                ₱{user.wallet.toFixed(2)}
              </h2>

              <p>
                Redeemed rewards
              </p>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>CONVERSION</span>
                <span>↔</span>
              </div>

              <h2>100 : 1</h2>

              <p>
                Points to peso
              </p>

            </div>

          </section>

          {/* EARNING */}
          <section className="content-grid">

            <div className="earning-panel">

              <div className="section-heading">
                <div>
                  <p className="card-kicker">
                    EARN POINTS
                  </p>

                  <h2>
                    Complete activities
                  </h2>
                </div>

                <span className="points-label">
                  ★ 100 pts = ₱1
                </span>
              </div>

              <div className="activities">

                {activities.map((activity) => {

                  const completed =
                    activity.id === "checkin" &&
                    alreadyCompletedToday("checkin");

                  return (
                    <div
                      className="activity"
                      key={activity.id}
                    >

                      <div className="activity-icon">
                        {activity.icon}
                      </div>

                      <div className="activity-info">
                        <strong>
                          {activity.title}
                        </strong>

                        <span>
                          {activity.description}
                        </span>
                      </div>

                      <div className="activity-reward">
                        <strong>
                          +{activity.points}
                        </strong>

                        <span>points</span>
                      </div>

                      <button
                        className={
                          completed
                            ? "claim claimed"
                            : "claim"
                        }
                        onClick={() =>
                          !completed &&
                          earnPoints(activity)
                        }
                        disabled={completed}
                      >
                        {completed
                          ? "Claimed"
                          : "Earn"}
                      </button>

                    </div>
                  );
                })}

              </div>

            </div>

            {/* REDEEM */}
            <div className="redeem-panel">

              <div className="redeem-icon">
                ₱
              </div>

              <p className="card-kicker">
                REDEEM
              </p>

              <h2>
                Turn points into money
              </h2>

              <p>
                Convert your available points into
                your simulated demo wallet.
              </p>

              <div className="conversion-box">

                <div>
                  <span>Your points</span>
                  <strong>
                    {user.points.toLocaleString()}
                  </strong>
                </div>

                <span className="arrow">
                  →
                </span>

                <div>
                  <span>Wallet value</span>
                  <strong>
                    ₱{pointsValue.toFixed(2)}
                  </strong>
                </div>

              </div>

              <button
                className="redeem-button"
                onClick={redeemPoints}
                disabled={user.points < POINTS_PER_PESO}
              >
                Redeem Points
              </button>

              <small>
                Minimum redemption: 100 points
              </small>

            </div>

          </section>

          {/* TRANSACTIONS */}
          <section className="history">

            <div className="section-heading">

              <div>
                <p className="card-kicker">
                  ACTIVITY
                </p>

                <h2>
                  Recent transactions
                </h2>
              </div>

            </div>

            {user.transactions?.length === 0 ? (

              <div className="empty">
                <span>📊</span>
                <strong>
                  No activity yet
                </strong>
                <p>
                  Complete an activity above to
                  start earning points.
                </p>
              </div>

            ) : (

              <div className="transaction-list">

                {user.transactions
                  .slice(0, 8)
                  .map((transaction) => (

                    <div
                      className="transaction"
                      key={transaction.id}
                    >

                      <div className="transaction-icon">
                        {transaction.type === "earn"
                          ? "+"
                          : "₱"}
                      </div>

                      <div>
                        <strong>
                          {transaction.title}
                        </strong>

                        <span>
                          {transaction.date}
                        </span>
                      </div>

                      <strong
                        className={
                          transaction.type === "earn"
                            ? "positive"
                            : "negative"
                        }
                      >
                        {transaction.type === "earn"
                          ? `+${transaction.points}`
                          : `-${transaction.points}`}{" "}
                        pts
                      </strong>

                    </div>

                  ))}

              </div>

            )}

          </section>

          <div className="demo-warning">
            {/* <strong>DEMO ONLY</strong>
            <span>
              This project simulates a rewards platform.
              Points and wallet balances have no real-world
              monetary value and no payments are processed.
            </span> */}
          </div>

        </main>
      )}

    </div>
  );
}


export default App;
