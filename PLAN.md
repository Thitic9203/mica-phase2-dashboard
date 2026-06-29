# Mica Phase 2 QA Dashboard — Build Plan

## Context

ทีม QA ต้องการ dashboard แบบ real-time สำหรับโปรเจกต์ **MICA2** (Mica Phase 2, Jira board 180)
เหมือนที่มีอยู่แล้วกับโปรเจกต์ OLS (`mica-ols-phase2` → https://mica-phase2-ols.pages.dev/)

MICA2 เป็น umbrella project ใหญ่ ประกอบด้วยหลายระบบย่อย แต่ OLS ถูกแยกไปอีกบอร์ด/dashboard แล้ว
จึงต้องสร้าง dashboard ใหม่ที่ track **3 ระบบที่เหลือ**: ELMS, CBMS, EvMS — จัดกลุ่มตามระบบ
เพื่อให้เห็นสถานะ TC / Story / Bug / QA Owner ของแต่ละ epic ในที่เดียว auto-refresh ทุก 30 นาที

**ผลลัพธ์รอบนี้:** GitHub repo ใหม่ `Thitic9203/mica-phase2-dashboard` (public) ที่ scaffold โค้ด dashboard
ครบพร้อม deploy + ไฟล์แผนนี้ภายใน repo (`PLAN.md`). ขั้น deploy จริงเป็น follow-up (ต้องใช้ secret + Cloudflare account)

## Decisions (ยืนยันแล้ว)

| เรื่อง | ค่าที่เลือก |
|------|-----------|
| ขอบเขต repo | Dashboard อย่างเดียว (copy แนวทาง `mica-ols-phase2`) |
| ระบบที่ track | ELMS, CBMS, EvMS (จัดกลุ่มตามระบบ) — **ตัด OLS** (แยกบอร์ดแล้ว) |
| ชื่อ repo | `mica-phase2-dashboard` |
| Owner / visibility | `Thitic9203` / **public** |
| Data strategy | **แยกตาม epic เหมือน OLS** (`parent = <epicKey>`) — user รับผิดชอบแจ้งทีมให้ใส่ epic link/ค่าให้ครบถูกต้องเอง |
| ค่าที่ไม่ระบุ | แสดงเป็น **"Empty"** ใน dashboard (เช่น TC Status ที่ยังไม่กรอก) แต่ **นับรวมตามจริงปกติ** ไม่ตัดทิ้ง |
| Environment | **env เดียว** (production บน `main`) — ไม่มี staging/prod แยก เพราะ dashboard read-only ไม่มี mutation |

## Reference Architecture (จาก `Thitic9203/mica-ols-phase2`)

Single-file static web app — ไม่มี build step, ไม่มี dependency:
- **Frontend:** vanilla JS + embedded CSS ใน `public/index.html` (~96KB) · SVG donut/pie charts เขียนเอง (ไม่มี chart lib) · ฟอนต์ Inter + JetBrains Mono · accent teal `#0F766E`
- **Backend:** Cloudflare Workers (`functions/`) เป็น proxy ไป Jira REST API v3 (แนบ Basic Auth) + proxy Firebase auth
- **Hosting:** Cloudflare Pages (git-triggered, deploy จาก `main`) — free tier
- **Auth:** Google Sign-In ผ่าน Firebase project `pluton-dashboard` + email whitelist (โดเมน `skilllane.com`) — Spark free tier
- **Data:** ดึง issue ต่อ epic, group by field, cache in-memory, re-render เมื่อเปลี่ยน group-by, refresh ทุก 30 นาที
- **Custom fields (instance-wide, skilllane.atlassian.net):** `cf[12128]` TC Status · `cf[12127]` Ticket Details Status · `cf[12120]` QA Owner (multi-user) · `cf[10008]` Sprint

## Epic Map — MICA2 (3 ระบบ, จัดกลุ่ม)

> MICA2 เป็น team-managed project (`simplified: true`) → ความสัมพันธ์ epic↔child ใช้ JQL `parent = <epicKey>`
> (ระหว่าง implement ยืนยันว่า `parent = MICA2-630` คืน children จริง; ถ้าไม่ใช่ fallback เป็น `"Epic Link" = ...`)

**EvMS — Evaluation/Exam Management System** (active สุด)
- MICA2-630 Exam Bank/Question Bank · MICA2-631 Exam Timetable · MICA2-632 Exam Grading
- MICA2-633 Exam Report and Evaluation · MICA2-634 Exam Room Management · MICA2-635 Create Exam (AI)
- MICA2-636 Exam Room · MICA2-706 Exam Session · MICA2-708 Exam Result

**ELMS — Extended Learning Management System**
- MICA2-125 AI Integration · MICA2-626 Google Docs · MICA2-627 Google Meet/VDO Conference
- MICA2-628 Google Drive · MICA2-629 Google Connect

**CBMS — Credit Bank Management System**
- MICA2-648 School Credit Bank Activation · MICA2-649 Curriculum Management · MICA2-650 Course Management
- MICA2-651 Credit Transfer (Learner) · MICA2-652 Credit Transfer (Staff) · MICA2-653 My Credit

(ตัดออก: MICA2-1 POC done, MICA2-258 Master Timeline, MICA2-259/260 timeline duplicates, OLS ทั้งหมด)

## Implementation Steps

### 1. สร้าง repo
- `gh repo create Thitic9203/mica-phase2-dashboard --public --description "Mica Phase 2 — MICA2 QA Dashboard (ELMS/CBMS/EvMS)"`
- clone, branch `main`

### 2. Scaffold โดย adapt จาก `mica-ols-phase2`
ดึงไฟล์ reference (`gh api .../contents/...`) มาเป็นฐาน แล้วแก้เฉพาะส่วน project-specific:

**`public/index.html`** (ไฟล์หลัก)
- เปลี่ยน `<title>` + brand → "Mica Phase 2 — MICA2 QA Dashboard"
- แทนที่ `EPICS` array เดิม (flat OLS filter IDs) ด้วยโครงสร้าง **จัดกลุ่มตามระบบ**:
  ```js
  const GROUPS = [
    { system: 'EvMS', epics: [{key:'MICA2-630', name:'Exam Bank/Question Bank'}, ...] },
    { system: 'ELMS', epics: [...] },
    { system: 'CBMS', epics: [...] },
  ]
  ```
- view "TC Status from each Epic" → render section header ต่อระบบ แล้วตามด้วย grid ของ epic cards (donut + legend) ของระบบนั้น
- เปลี่ยนการดึงข้อมูล: `fetchFilterIssues(filterId)` → `fetchEpicIssues(epicKey)` ที่ยิง `jql=parent=<epicKey>` แทน `jql=filter=<id>` (ตัด dependency กับ saved filter)
- view "Ticket Overview" / Story&Bug: ใช้ JQL รวม `parent in (<epic ทั้งหมด 3 ระบบ>)` แทน global filter 20774/20724
- custom field IDs คงเดิม (instance เดียวกัน) — **ค่าที่ยังไม่กรอก (TC Status/QA Owner/Sprint ฯลฯ) ให้ bucket เป็น "Empty"** แล้ว **นับรวมตามจริงปกติ** (ไม่ตัด Story ที่ไม่มี sprint ออกแบบ reference) — user จะไปแจ้งทีมให้กรอกค่าให้ครบเอง
- คง: SVG chart, status keyword colors, search/filter/sort/pagination, 30-min auto-refresh, responsive breakpoints

**`functions/api/jira/[[path]].js`** (Jira proxy) — **จุดที่ต้องปรับเพื่อความปลอดภัย**
- reference hardcode Basic Auth token ใน worker → **ห้ามทำซ้ำ** เพราะ repo เป็น public (token จะรั่ว)
- อ่าน token จาก env แทน: `const auth = env.JIRA_AUTH;` (Cloudflare Pages environment secret)
- ถ้า `env.JIRA_AUTH` ไม่มี → ตอบ 500 พร้อมข้อความชัดเจน

**`functions/__/auth/[[path]].js`** — reuse Firebase auth proxy ตามเดิม (ชี้ `pluton-dashboard`)

**`public/_headers`, `public/_redirects`** — copy ตามเดิม (cache no-store + rewrite `/api/jira/*`)

**`README.md`** — เขียนใหม่สำหรับ MICA2: ลิงก์ board 180, ระบบที่ track, วิธี deploy, ตัวแปร secret ที่ต้องตั้ง

**`PLAN.md`** — คัดลอกแผนนี้เข้า repo (rule 4: doc คู่กับงาน)

### 3. Deploy (follow-up — ต้องมี action จาก user, ทำหลัง repo เสร็จ)
จะ **ไม่** ทำอัตโนมัติ เพราะต้องใช้ secret + Cloudflare account (รอสัญญาณจาก user):
1. เชื่อม repo เข้า Cloudflare Pages (build output = `public/`, free tier — ไม่มีค่าใช้จ่าย)
2. ตั้ง environment secret `JIRA_AUTH` = `base64(email:api_token)` ใน Cloudflare Pages settings
3. เพิ่ม email ทีม MICA2 เข้า whitelist (ใน `index.html` หรือ Apps Script endpoint เดิม)
4. verify ที่ `mica-phase2-dashboard.pages.dev`

## Security & Cost Notes

- **ไม่มี org spend** (rule 3): Cloudflare Pages free tier, Firebase Spark free, GitHub public repo — ทุกอย่างฟรี ✅
- **Secret handling** (rule 7): Jira token อ่านจาก Cloudflare env secret เท่านั้น — ไม่ hardcode ใน public repo
- **No-break** (rule 5): เป็น repo ใหม่ทั้งหมด ไม่กระทบ `mica-ols-phase2` หรือ dashboard OLS เดิม
- Firebase web config + email whitelist เป็น client-side (ไม่ใช่ secret) → reuse ได้

## Verification

1. **Local:** เปิด `public/index.html` ผ่าน dev server (เช่น `npx wrangler pages dev public`) ตั้ง `JIRA_AUTH` ชั่วคราว → ตรวจว่า epic cards ทั้ง 3 ระบบโหลด, donut/legend ขึ้น, search/filter/sort/pagination ทำงาน
2. **JQL check:** ยืนยัน `parent = MICA2-630` คืน children จริงผ่าน Jira (ถ้าไม่ใช่ → สลับเป็น `"Epic Link"`)
3. **Repo check:** `gh repo view Thitic9203/mica-phase2-dashboard` แสดงไฟล์ครบ (public/, functions/, README, PLAN.md)
4. **Deploy check (follow-up):** หลังเชื่อม Cloudflare Pages + ตั้ง secret → เปิด `*.pages.dev` ผ่าน Google Sign-In แล้วเห็นข้อมูล MICA2 จริง, auto-refresh ทำงาน
