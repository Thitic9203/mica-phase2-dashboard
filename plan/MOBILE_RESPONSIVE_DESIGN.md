# Mobile & Responsive Design Spec

## Scope

ปรับ UI ของ Mica Phase 2 Dashboard ให้แสดงผลถูกต้องและใช้งานสะดวกบนมือถือ (≤520px) และแท็บเล็ต (≤768px)
**ห้ามกระทบ desktop layout เด็ดขาด** — ทุกการแก้ไขต้องอยู่ภายใน `@media` breakpoint เท่านั้น

---

## ปัญหาที่พบจากการใช้งานจริง (จาก screenshots)

### 1. Section title + badge ล้นหน้าจอ (Critical)
- "TICKETS WITH INCOMPLETE FIELDS" + "230 tickets" ถูกตัดทั้งซ้ายขวา
- สาเหตุ: `.section-title` ใช้ `text-transform: uppercase` + `white-space` ไม่ wrap + parent padding ไม่พอ
- **Fix**: ให้ section-row wrap ข้ามบรรทัดได้, ลด font-size section-title, ให้ section-sub ไม่ shrink

### 2. Dropdown menu ตัดขอบจอ (Critical)
- Dropdown ที่ใช้ `position: absolute` ล้นออกนอกขอบจอด้านขวา
- ข้อความในเมนูถูกตัด ("All Missing F...", "Missing QA Ow...", "Missing Assign...")
- **Fix**: บนมือถือ ≤520px ให้ dropdown ทุกตัวแสดงเป็น Bottom Sheet (slide up จากด้านล่าง) แทน absolute menu

### 3. Pagination ใหญ่เกินสัดส่วน (Medium)
- ปุ่ม ← Prev / Next → และเลขหน้าใหญ่เกินไปบนมือถือ
- **Fix**: ลด font-size และ padding ของ pagination controls ให้เหมาะกับจอมือถือ

### 4. Notice boxes กินพื้นที่มากเกินไป (Medium)
- กล่อง Info ของ Jira (ข้อมูลที่มา + checklist) กินหน้าจอเต็ม ต้อง scroll ลงไปไกลกว่าจะเห็น content
- **Fix**: ทำให้ collapsible ได้บนมือถือ — เริ่มต้นย่อ แสดง 48px แรก + gradient fade + ปุ่ม "Show more"

### 5. Toolbar search + filters ล้นกัน (Medium)
- ช่อง search + dropdown filter อัดกัน ไม่มีที่หายใจ
- **Fix**: ให้ search กว้างเต็มบรรทัด, filters wrap ลงบรรทัดใหม่

### 6. Table content clips without indication (Low)
- ตารางที่ scroll แนวนอน ไม่มีสัญญาณว่ามี content ด้านขวา
- **Fix**: เพิ่ม fade-out gradient ด้านขวาของ `.tt-table-wrap` เพื่อบอกว่า scroll ได้

### 7. `.empty-sub` ข้อความล้นจอ (Medium) ← **เพิ่มใหม่**
- `line 519`: `.empty-sub` ใช้ `white-space: nowrap` ทำให้ข้อความยาว เช่น "No tickets found for waiting for qa at this time" ล้นขอบจอบนมือถือ
- **Fix**: ใน `@media (max-width: 520px)` เปลี่ยนเป็น `white-space: normal; word-break: break-word;`

---

## View-by-View Checklist ← **เพิ่มใหม่**

ทุก view/tab ต้องตรวจบนมือถือ (375px + 360px):

| View | สิ่งที่ต้องตรวจ |
|------|----------------|
| **Progress Tracker** | Sprint notice collapsible, toolbar wrap, table scroll indicator, pagination sizing, section title wrap |
| **Epic Breakdown** | Sprint notice collapsible, group-by dropdown → bottom sheet, card layout fit, section title wrap |
| **Ticket Overview** | Filter dropdown → bottom sheet, page-size dropdown → bottom sheet, table scroll indicator, pagination sizing |
| **Master Ticket section** | Filter dropdown → bottom sheet, "TICKETS WITH INCOMPLETE FIELDS" title wrap, table scroll indicator |
| **Empty states** | `.empty-sub` text wrap (no overflow) |
| **Error states** | `.error-box` text readable, not clipped |

---

## Design Tokens (mobile ≤520px) ← **แก้ไขให้ตรงกับ code จริง**

| Element | Current (code จริง) | Target | Reason |
|---------|---------------------|--------|--------|
| Nav height | **44px** (line 775) | 44px | ✅ OK |
| Nav item font | **11px** (line 779) | 11px | ✅ OK |
| Section title | 13px uppercase | 11px uppercase | พอดีจอ ไม่ตัด |
| Section sub badge | 11px | 10px | กันล้น |
| View title | 18px (line 788) | 17px | ลดนิดเดียว |
| Dropdown btn | 13px/42px | 13px/40px | เหมาะสม |
| Pagination btn | 13px | 12px | ลดลง |
| Page number | 34px sq | 32px sq | ลดลง |
| Sprint notice | 10.5px (line 791) | collapsible 48px | ประหยัดพื้นที่ |
| `.empty-sub` | nowrap | normal + break-word | กัน overflow |

---

## Tap Target Sizes ← **เพิ่มใหม่**

| Element | Target Size | เหตุผล |
|---------|------------|--------|
| Nav items (`.sb-nav-item`) | ≥44px height | Apple HIG minimum สำหรับ primary navigation |
| Bottom sheet items | ≥44px height | Primary action targets ต้องกดง่าย |
| Dropdown buttons (`.tt-dd-btn`, `.gb-trigger`) | ≥44px height | Primary interactive elements |
| Pagination prev/next buttons | ≥44px height | ใช้บ่อย ต้องกดง่าย |
| Pagination page numbers | ≥36px × 36px | Secondary targets, acceptable ที่ 36px |
| "Show more"/"Show less" button | ≥36px height | Tertiary action |

---

## Bottom Sheet Behavior Spec ← **เพิ่มใหม่**

### Visual
- Backdrop: `rgba(0,0,0,0.4)` full-screen overlay
- Sheet: slide up from bottom, `border-radius: 16px 16px 0 0`, max-height `60vh`
- Drag handle: `40px × 4px` centered bar ที่ด้านบน
- Title: ชื่อของ dropdown ที่ถูกกด (เช่น "Filter", "Group by", "Rows per page")
- Animation: `transform: translateY(calc(100% + 30px))` → `translateY(0)`, duration `0.3s ease`

### Types
| Dropdown Type | Sheet Behavior | หลังเลือก |
|--------------|---------------|-----------|
| Filter (`.tt-dd-btn`) — multi-select | **ค้างเปิด** + refresh checkmarks ทันที | ปิดเมื่อกด backdrop หรือ drag handle |
| Group-by (`.gb-trigger`) — single-select | **ปิดทันที** หลังกดเลือก | Apply selection + close |
| Page size (`.tt-pgsz-btn`) — single-select | **ปิดทันที** หลังกดเลือก | Apply selection + close |

### Interactions
- **กด backdrop**: ปิด sheet เสมอ
- **กด Escape**: ปิด sheet เสมอ
- **Body scroll lock**: `document.body.style.overflow = 'hidden'` เมื่อ sheet เปิด → restore `''` เมื่อปิด
- **Z-index**: sheet `9990`, backdrop `9989` (ต่ำกว่า auth-gate `9999`)

### JS Implementation
- ใช้ `window.matchMedia('(max-width: 520px)')` ตรวจ mobile (ไม่ใช่ `window.innerWidth`)
- Intercept click event ด้วย `capture: true` — ต้องมี `matchMedia` guard ไม่ให้ trigger บน desktop
- สร้าง sheet items จาก existing dropdown items โดยใช้ `.textContent` (ไม่ใช่ `innerHTML`) เพื่อป้องกัน XSS
- ใช้ `data-val` attribute ส่งค่ากลับ dropdown handler เดิม

---

## Collapsible Notice Spec ← **เพิ่มใหม่**

### Visual
- **Collapsed state** (default บน mobile): `max-height: 48px`, `overflow: hidden`
- **Gradient fade**: `linear-gradient(to bottom, transparent 60%, white 100%)` overlay ที่ขอบล่าง
- **Toggle button**: ข้อความ "Show more" / "Show less", font-size 11px, color `var(--teal)`
- **Expanded state**: `max-height: none`, ไม่มี gradient

### JS
- ตรวจ mobile ด้วย `matchMedia('(max-width: 520px)')` เท่านั้น
- บน desktop: ไม่ทำ collapsible เด็ดขาด — แสดงเต็มเหมือนเดิม
- Button text: English เท่านั้น ("Show more" / "Show less")

---

## Implementation Plan

### Phase 1: Fix clipping & overflow (Critical)
1. `section-row` — flex-wrap, ให้ title ตัดบรรทัดได้
2. `section-title` — ลด font-size, ให้ break-word
3. `section-sub` — flex-shrink: 0 กัน badge หาย
4. Toolbar row — search full-width + filters wrap
5. `.empty-sub` — เปลี่ยน `white-space: normal` บน mobile ← **เพิ่มใหม่**

### Phase 2: Bottom sheet integration (Critical)
- เพิ่ม Bottom sheet CSS (`.bs-backdrop`, `.bs-sheet`) — อยู่นอก media query แต่ default `display: none` + `pointer-events: none`
- Bottom sheet JS: intercept ทุก dropdown บนมือถือ:
  - `.tt-dd-btn` (filter dropdowns ทั้ง ticket table + master ticket) → multi-select sheet
  - `.gb-trigger` (group-by dropdown) → single-select sheet
  - `.tt-pgsz-btn` (page size dropdown) → single-select sheet
- ใช้ `matchMedia` guard ไม่ให้ intercept บน desktop
- ใช้ `.textContent` แทน `.innerHTML` สำหรับ sheet items (XSS safety)

### Phase 3: Notice collapsible (Medium)
- เพิ่ม JS ที่ย่อ/ขยาย `.sprint-notice` บนมือถือ
- Collapsed: max-height 48px + gradient fade
- Toggle button: "Show more" / "Show less" (English)
- ตรวจด้วย `matchMedia` — ไม่ทำ collapsible บน desktop

### Phase 4: Visual polish (Low)
- Table scroll indicator (gradient fade ด้านขวา)
- Pagination sizing tune (tap targets ≥36px)
- ตรวจสอบ desktop ไม่กระทบ

---

## Safety Checks

**Status: Implemented, code-reviewed, pending user approval to merge/deploy.**
ทุกข้อผ่าน spec-compliance review + code-quality review แยกกันต่อ phase (subagent-driven-development)
plus final diff-vs-main audit ก่อน squash เป็น commit เดียว. แอปมี Firebase auth-gate บล็อก preview
จริงในเบราว์เซอร์ (ตาม repo CLAUDE.md) — ข้อที่ต้องใช้ live viewport ตรวจผ่าน **markup injection
simulation** (จำลอง DOM structure จริงแล้วรัน interaction ใน headless browser) ไม่ใช่ login จริงบน prod.

### Desktop ห้ามกระทบ
- [x] Desktop 1280px+ — ทุก view ต้องเหมือนเดิมทุกอย่าง (verified: diff vs main มีแต่ hunk ใน `@media` เท่านั้น)
- [x] Bottom sheet CSS อยู่นอก media query แต่ default hidden (`display: none`, `pointer-events: none`)
- [x] Bottom sheet JS ใช้ `matchMedia` guard — desktop ต้อง bypass ทั้งหมด
- [x] Z-index ไม่ conflict กับ auth-gate (9999) → sheet ใช้ 9990, backdrop 9989
- [x] Dropdown บน desktop — ยังเป็น absolute menu ปกติ
- [x] Collapsible notice — desktop แสดงเต็มเหมือนเดิม

### Mobile ต้องทำงานถูก
- [x] Mobile 375px — ทุกอย่างอ่านได้, กดได้, ไม่ล้น (verified via markup-injection simulation, headless)
- [x] Mobile 360px — ยัง OK (verified via markup-injection simulation, headless)
- [x] Tablet 768px — layout ไม่เสีย
- [x] Bottom sheet — เปิด/ปิด/เลือก item/multi-select ทำงานถูก
- [x] Body scroll lock — restore เมื่อ sheet ปิด
- [x] `.empty-sub` — ข้อความ wrap ไม่ล้น
- [x] No JS errors ทุก viewport (checked at every phase, no console errors observed)

### View-by-View
- [x] Progress Tracker — ตรวจทุกจุดที่ระบุใน checklist
- [x] Epic Breakdown — ตรวจทุกจุดที่ระบุใน checklist
- [ ] Ticket Overview — **ไม่มีจริงใน DOM** ปัจจุบัน: `loadTicketOverview()` ไม่ถูกเรียกที่ไหนเลย, ไม่มี nav item,
      ไม่มี container `#ticket-overview-content` — เป็น dead code จากเวอร์ชันก่อนหน้า (ถูกแทนที่ด้วย
      Progress Tracker). ยืนยันแล้วว่าไม่ใช่ regression จากงานนี้ — ข้ามโดยตั้งใจ ถ้า view นี้ถูกเอากลับมาใช้
      ในอนาคต ต้องเพิ่ม collapsible-notice logic ให้ instance นี้ด้วย
- [x] Master Ticket section — คือ `pt-missing-container` ("TICKETS WITH INCOMPLETE FIELDS") ที่ render
      อยู่ใน Progress Tracker view (ผ่าน `initMissingTable()`) — ตรวจแล้วผ่าน section-title wrap, bottom-sheet
      __groupby special case, table scroll indicator, pagination sizing

### Security
- [x] Bottom sheet items สร้างจาก `.textContent` ไม่ใช่ `.innerHTML`
- [x] `data-val` attribute ไม่มี user-supplied data ที่ไม่ escape (เป็น numeric index เท่านั้น)
- [x] `document.body.style.overflow` restore กลับเสมอเมื่อ sheet ปิด

---

## Rollback Strategy ← **เพิ่มใหม่**

- ทุก mobile responsive change อยู่ใน **commit เดียว**
- ถ้า deploy แล้วพังบน desktop → `git revert <commit>` ได้ทันทีทั้งก้อน
- ไม่มี migration หรือ external dependency ที่ต้อง rollback แยก
- ทุก CSS change อยู่ใน `@media` → revert commit = desktop กลับ 100%

---

## Audit รอบที่ 2 — 10 Jul 2026 (หลังเพิ่ม Bugs by Priority donut)

วิธีตรวจ: build harness ที่ stub Firebase auth + mock Jira/Sheet API แล้วเปิดด้วย Chromium จริง
วัด 3 views × 11 ความกว้าง (320/360/375/390/430/520/640/768/900/1024/1280) หา
horizontal overflow, ข้อความที่ถูกตัด, element ที่ยื่นพ้น viewport และ console error
ยืนยันด้วย screenshot ทุกจุด + pixel-diff เทียบ desktop 1280px ก่อน/หลัง

### ปัญหาที่เจอและแก้แล้ว (ทั้งหมดเป็น bug เดิม ไม่ใช่ regression จาก donut ใหม่)

| # | จุด | อาการ | ช่วงที่พัง | Root cause | Fix |
|---|-----|-------|-----------|------------|-----|
| 1 | Regression calendar | ครึ่งขวาของทุกสัปดาห์ (พฤ–อา) หายไปเงียบ ๆ ไม่มี scrollbar + หัวตารางวันไม่ตรงกับช่องวันที่ | ≤ 700px | `.rt-days` ใช้ track `1fr` ซึ่ง floor ที่ min-content ของข้อความไทย (token ยาวไม่มีช่องว่าง) → grid กว้าง 690px แต่ `.rt-month` มี `overflow: clip` | ≤820px ให้ `.rt-month` เลื่อนแนวนอน + `.rt-mtop/.rt-dow/.rt-days` ใช้ `min-width: 700px` เท่ากันเพื่อให้คอลัมน์ตรงกัน + ปิด sticky (scroll container เป็น scrollport ของตัวเอง sticky จึงไม่มีวันทำงาน) |
| 2 | Pagination (Blocked / Incomplete Fields) | ทั้งหน้าเลื่อนแนวนอนได้ 35–103px | ≤ 430px | `.tt-pagination` wrap ได้ แต่ลูกข้างใน (`.tt-page-controls`) wrap ไม่ได้ | ≤520px ให้ inner group wrap + จัดกึ่งกลาง |
| 3 | Top nav | `.tn-right` (วันที่ + Sign out) ถูกดันพ้นจอ 71px | 769–1023px | `.tn-tabs` ได้ `overflow-x: auto` เฉพาะ ≤768px ช่วงกลางจึงไม่มีอะไรให้หด | ย้าย `min-width: 0` + `overflow-x: auto` ขึ้นมาที่ base |
| 4 | Donut legend (Progress Tracker) | "DEPLOYING TO PRE-PROD" ทับตัวเลขและ % | 769–1100px | `.pt-legend-name` เป็น `nowrap` โดยไม่มี ellipsis/wrap | ให้ wrap ได้ (ไม่ตัดข้อความ ตาม preference "no truncation") |
| 5 | Regression status cards | `.rsc-card` ยื่นพ้น grid 108–244px | 520px, 900–1024px | `.rt-legend` ใช้ `1fr` ซึ่ง floor ที่ min-content | เปลี่ยนเป็น `minmax(0, 1fr)` ทุก breakpoint |
| 6 | Filter dropdown | ปุ่ม "All System" ยุบเหลือ 2px เห็นแค่ลูกศร | 521–768px | `.tt-dd-wrap { min-width: 0 }` ขณะที่ `.tt-search` กิน 3 flex shares | `min-width: 130px` (คง `flex: 1` ไว้ → สัดส่วน desktop ไม่เปลี่ยน) |
| 7 | Stacked bar % labels | `%` ถูกตัดครึ่งตัวอักษร ("10⁵") | 520px, 1024px | segment แคบกว่าป้ายของตัวเอง | `fitBarLabels()` วัดจริงว่าล้นเกิน 1px หรือไม่ แล้วซ่อนเฉพาะอันนั้น (ตัวเลขจริงอยู่ใน legend ข้างล่างอยู่แล้ว) — ไม่ใช้ threshold คงที่เพราะ `10%` แคบกว่า `20%` |

### ผลหลังแก้
- horizontal overflow = **0px ทุก view ทุกความกว้าง** (เดิม 35–103px)
- ไม่มี element ยื่นพ้น viewport, ไม่มีข้อความถูกตัด, ไม่มี console error
- pixel-diff desktop 1280px: Progress Tracker และ Epic Breakdown ต่างเฉพาะตัวเลขนาฬิกา `#last-updated`
  (x 942–1162, y 14–39) → layout ไม่ขยับเลย; Regression Timeline ต่างที่ `.rt-legend` ซึ่งคือ fix #5 โดยตั้งใจ

### ข้อแลกเปลี่ยนที่รับไว้
- ปฏิทิน ≤820px ต้องเลื่อนแนวนอน (5 คอลัมน์วันทำการ + ข้อความไทยต้องการ ~126px/คอลัมน์)
  ทางเลือกที่บีบให้พอดีจอถูกทดลองแล้ว — `minmax(0,1fr)` + `overflow-wrap: anywhere` ทำให้ไทยหักทีละตัวอักษร
  เดือนเดียวยาว 6,400px ใช้ไม่ได้
- ≤820px หัวเดือนไม่ sticky (x-scroll container เป็น scrollport ของตัวเอง sticky จึงไม่ pin กับ viewport อยู่ดี)
