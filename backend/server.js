import express from "express";
import session from "express-session";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

/* ===== 기본 미들웨어 ===== */
app.use(express.json());

/*
  개발 중 Live Server(5500)에서 접근할 때를 위해 남겨둠.
  하지만 아래 정적서빙을 적용하면 프론트를 5000에서 열게 되므로
  CORS 없이도 동작한다.
*/
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    credentials: true,
  })
);

/* ===== 경로 유틸 (backend 폴더 기준으로 프로젝트 루트 찾기) ===== */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

/* ✅ 프론트(정적 파일)도 백엔드에서 함께 서빙 */
app.use(express.static(PROJECT_ROOT));

/* ===== 세션 ===== */
app.use(
  session({
    secret: "whatisf1-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // 로컬 개발(HTTP)에서는 false, 배포(HTTPS)에서는 true로 바꾸는 게 정석
      secure: false,
      // 같은 사이트(같은 origin)로 열 거라 Lax로도 충분
      sameSite: "lax",
    },
  })
);

/* ===== 데이터 경로 ===== */
const NEWS_JSON_PATH = path.join(PROJECT_ROOT, "news", "news.json");
const USERS_JSON_PATH = path.join(PROJECT_ROOT, "backend", "data", "users.json");

/* ===== 헬스체크 ===== */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

/* ===== 뉴스 JSON 로드/저장 ===== */
async function readNewsJson() {
  try {
    const raw = await fs.readFile(NEWS_JSON_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/* ===== 유저 로드/저장 ===== */
async function readUsers() {
  try {
    const raw = await fs.readFile(USERS_JSON_PATH, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
async function writeUsers(list) {
  await fs.writeFile(USERS_JSON_PATH, JSON.stringify(list, null, 2), "utf-8");
}

/* =========================================================
   API v1
========================================================= */

/* ===== 뉴스 목록 (+필터) ===== */
app.get("/api/v1/news", async (req, res) => {
  try {
    const { tag, sourceClass, q, limit } = req.query;

    let list = await readNewsJson();

    if (tag && tag !== "all") {
      list = list.filter((it) => Array.isArray(it.tags) && it.tags.includes(tag));
    }
    if (sourceClass && sourceClass !== "all") {
      list = list.filter((it) => it.sourceClass === sourceClass);
    }
    if (q) {
      const keyword = String(q).toLowerCase();
      list = list.filter((it) => {
        const t = `${it.title ?? ""} ${it.summary ?? ""}`.toLowerCase();
        return t.includes(keyword);
      });
    }

    // 최신순 정렬
    list.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

    // limit 적용
    if (limit) {
      const n = Number(limit);
      if (!Number.isNaN(n) && n > 0) list = list.slice(0, n);
    }

    res.json(list);
  } catch (e) {
    console.error("GET /api/v1/news error:", e);
    res.status(500).json({ error: "Failed to load news" });
  }
});

/* ===== 뉴스 상세 ===== */
app.get("/api/v1/news/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const list = await readNewsJson();

    const item = list.find((x) => String(x.id) === String(id));
    if (!item) return res.status(404).json({ error: "Not found" });

    res.json(item);
  } catch (e) {
    console.error("GET /api/v1/news/:id error:", e);
    res.status(500).json({ error: "Failed to load news detail" });
  }
});

/* ===== 임시 관리자 계정 ===== */
const ADMIN = {
  email: "admin@whatisf1.com",
  password: "admin1234",
};

/* ===== 회원가입 ===== */
app.post("/api/v1/auth/signup", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email/password required" });
  }

  const users = await readUsers();
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const user = {
    id: Date.now(),
    email,
    password, // ⚠️ 포트폴리오 단순화(실서비스는 해시)
    role: "user",
  };

  users.push(user);
  await writeUsers(users);

  res.json({ ok: true });
});

/* ===== 로그인 ===== */
app.post("/api/v1/auth/login", async (req, res) => {
  const { email, password } = req.body;

  // 관리자
  if (email === ADMIN.email && password === ADMIN.password) {
    req.session.user = { role: "admin", email };
    return res.json({ ok: true, role: "admin" });
  }

  // 일반 유저
  const users = await readUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session.user = { role: "user", email };
  res.json({ ok: true, role: "user" });
});

/* ===== 현재 로그인 상태 확인 ===== */
app.get("/api/v1/auth/me", (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  res.json({
    loggedIn: true,
    role: req.session.user.role,
    email: req.session.user.email,
  });
});

/* ===== 로그아웃 ===== */
app.post("/api/v1/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

/* ===== 관리자 체크 미들웨어 ===== */
function requireAdmin(req, res, next) {
  if (req.session?.user?.role === "admin") return next();
  res.status(403).json({ error: "Admin only" });
}

/* ===== 뉴스 생성 (admin only) ===== */
app.post("/api/v1/news", requireAdmin, async (req, res) => {
  try {
    const list = await readNewsJson();
    const body = req.body;

    const newItem = {
      id: Date.now(),
      sourceClass: body.sourceClass || "media",
      source: body.source || "",
      title: body.title || "",
      image: body.image || "",
      summary: body.summary || "",
      tags: body.tags || [],
      pubDate: new Date().toISOString(),
    };

    list.unshift(newItem);
    await fs.writeFile(NEWS_JSON_PATH, JSON.stringify(list, null, 2), "utf-8");
    res.json(newItem);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Create failed" });
  }
});

/* ===== 뉴스 수정 (admin only) ===== */
app.put("/api/v1/news/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const list = await readNewsJson();
    const idx = list.findIndex((it) => String(it.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: "Not found" });

    list[idx] = {
      ...list[idx],
      ...req.body,
      id: list[idx].id,
    };

    await fs.writeFile(NEWS_JSON_PATH, JSON.stringify(list, null, 2), "utf-8");
    res.json(list[idx]);
  } catch (e) {
    res.status(500).json({ error: "Update failed" });
  }
});

/* ===== 뉴스 삭제 (admin only) ===== */
app.delete("/api/v1/news/:id", requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    let list = await readNewsJson();
    const before = list.length;

    list = list.filter((it) => String(it.id) !== String(id));
    if (list.length === before) return res.status(404).json({ error: "Not found" });

    await fs.writeFile(NEWS_JSON_PATH, JSON.stringify(list, null, 2), "utf-8");
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Delete failed" });
  }
});

/* ===== 서버 시작 ===== */
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📌 News JSON path: ${NEWS_JSON_PATH}`);
  console.log(`📌 Static serving root: ${PROJECT_ROOT}`);
});
