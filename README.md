# Hệ thống Smart Farm

Đây là ứng dụng Smart Farm, được xây dựng dựa trên bản thiết kế từ [Figma](https://www.figma.com/design/AiKnETugNf98CMicdC3FeV/Smart-farm).

Công trình bao gồm giao diện người dùng (Frontend), API điều khiển (Backend Node.js), và **module Báo Cáo (Report)** vừa được hệ thống hoá và viết lại lại toàn bộ bằng công nghệ Python (FastAPI).

## Cấu trúc Dự án

- `src/` & `backend/`: Mã nguồn của giao diện Frontend react và API nền tảng.
- `report_service/`: Module lập báo cáo xuất file định dạng PDF/Excel/CSV v.v.. Chức năng này mới được nâng cấp/refactor để tận dụng khả năng tính toán của Python (FastAPI + SQLAlchemy 2.0).
- `schema.sql`: Tệp tin DDL gom chung toàn bộ cấu trúc DB của Smart Farm, gồm các module quản trị thiết bị cốt lõi cũ và các bảng chuẩn hoá mới của Report.

---

## Hướng dẫn Vận hành & Cài đặt Chi tiết

Bước tiên quyết: Bạn cần Import CSDL vào MySQL hoặc PostgreSQL cục bộ thông qua tệp `schema.sql`:
```bash
mysql -u root -p < schema.sql
```

### 1. Vận hành Node.js (Frontend / Main Backend)
Ở thư mục gốc dự án, cài đặt các packages và chạy môi trường dev:

```bash
npm install
npm run dev
```

### 2. Vận hành module Report (Python FastAPI)
Phần xuất báo cáo, lọc dữ liệu giờ chạy tách rời ở Port `8000` thông qua code Python nâng cấp:

1. **Truy cập vào source code báo cáo**:
   ```bash
   cd report_service
   ```
2. **Setup môi trường ảo (Virtual Env)**:
   ```bash
   python3 -m venv venv
   
   # Đối với macOS/Linux:
   source venv/bin/activate
   
   # Đối với Windows/Cmd:
   venv\Scripts\activate.bat
   ```
3. **Cài đặt thư viện xử lý Data/PDF/Excel**:
   ```bash
   pip install -r requirements.txt
   ```
4. *(Tùy chọn) Chạy quản lý phiên bản DB Alembic*:
   Kiểm tra URI String của CSDL tại `report_module/core/config.py` và chạy nâng cấp db:
   ```bash
   alembic upgrade head
   ```
5. **Khởi động Report Server**:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   
> **Lưu ý**: Bạn có thể thao tác gen dữ liệu mock, gen bảng PDF báo cáo và xem toàn bộ endpoint đang bảo trì trên giao diện kiểm thử Swagger UI tại: [http://localhost:8000/docs](http://localhost:8000/docs).
