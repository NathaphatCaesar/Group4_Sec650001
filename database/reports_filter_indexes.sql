-- Task43: index สำหรับกรองรายงานตามหมวดหมู่ (reason) และสถานะ (status)
-- กรองตามสถานะอย่างเดียวใช้ reports_status_idx ที่มีอยู่แล้วใน reports.sql

-- กรองตามหมวด หรือหมวด + สถานะ แล้วเรียงตามวันที่รายงาน
create index if not exists reports_reason_status_created_idx
  on reports(reason, status, created_at desc);

-- ไม่กรองอะไร แค่เรียงตามวันที่รายงาน
create index if not exists reports_created_idx
  on reports(created_at desc);
