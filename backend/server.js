import express from "express";
import session from "express-session";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(
  cors({
    origin: true,
    credentials: true
  })
);

app.use(
  session({
    secret: "whatisf1-secret",
    resave: false,
    saveUninitialized: false
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
