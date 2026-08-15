# EPIONARA - Kiến trúc cơ sở dữ liệu E2EE & RAG

Thư mục này chứa cấu trúc và tài liệu hướng dẫn vận hành cơ sở dữ liệu đám mây Supabase cho dự án EPIONARA, tích hợp chế độ mã hóa đầu cuối (End-to-End Encryption - E2EE) và truy vấn ngữ nghĩa cục bộ (Local BM25 RAG).

---

## 🔒 1. Thiết kế Mã hóa đầu cuối (E2EE)

Nhật ký và thông tin cá nhân là các dữ liệu nhạy cảm nhất. Để bảo mật tối đa, EPIONARA áp dụng mô hình E2EE:

1. **Khóa mã hóa:** Khi người dùng thiết lập mật khẩu, trình duyệt sử dụng thuật toán **PBKDF2** (với 310,000 vòng lặp kết hợp Salt duy nhất của User ID) để tạo khóa đối xứng AES-GCM 256-bit trong RAM.
2. **Quá trình lưu trữ cục bộ:** Dữ liệu nhật ký và CBT ghi vào IndexedDB được giải mã trong bộ nhớ tạm thời khi cần hiển thị.
3. **Quá trình đồng bộ (Sync):** Trước khi đẩy lên Supabase Cloud, dữ liệu thô (plaintext) được chuyển đổi thành JSON string và mã hóa thông qua **AES-GCM**. Chuỗi mã hóa (ciphertext) cùng với vector khởi tạo (IV) có định dạng `ivHex:ciphertextHex` sẽ được đẩy lên trường `encrypted_data` của cơ sở dữ liệu.
4. **Tính riêng tư:** Supabase backend và quản trị viên hệ thống hoàn toàn không thể xem nội dung nhật ký của người dùng vì dữ liệu lưu trên cloud hoàn toàn là chuỗi mã hóa.

---

## ⚙️ 2. Tại sao RAG (Retrieval-Augmented Generation) được chạy ở Client?

> [!NOTE]
> Thông thường, các ứng dụng AI RAG sử dụng cơ chế lưu trữ Vector Embedding trực tiếp trên Cloud Database (như `pgvector` trên Postgres) để tìm kiếm tương đồng. Tuy nhiên, kiến trúc E2EE đặt ra thách thức: **Dữ liệu trên Cloud đã bị mã hóa, DB không thể đọc và tính toán Embedding.**

Để bảo vệ quyền riêng tư tuyệt đối cho người dùng mà vẫn hỗ trợ AI RAG thông minh, EPIONARA triển khai **Client-side RAG Engine**:

- **Cơ chế hoạt động:**
  1. Khi người dùng chat với MindBot hoặc yêu cầu phân tích tâm trạng, ứng dụng sẽ giải mã toàn bộ nhật ký local từ IndexedDB.
  2. RAG Engine tại client sẽ tiến hành làm sạch, token hóa và mở rộng truy vấn (Emotion-aware Query Expansion) dựa trên ngữ cảnh cảm xúc hiện tại.
  3. Sử dụng thuật toán **BM25** cải tiến kết hợp với hệ số **suy giảm thời gian (Temporal Decay)** (ưu tiên nhật ký gần nhất) để chọn ra tối đa 2 dòng nhật ký phù hợp nhất.
  4. Nội dung nhật ký thô được nạp thẳng vào System Instruction của Gemini API dưới vai trò Nhà trị liệu/Life Coach.
- **Ưu điểm:**
  - Bảo mật tuyệt đối 100% E2EE.
  - Chạy cực nhanh không cần chờ phản hồi mạng từ vector DB.
  - Hỗ trợ hoạt động hoàn toàn ngoại tuyến (Offline mode).

---

## 🚀 3. Hướng dẫn thiết lập Supabase

1. Tạo một project mới trên [Supabase Console](https://supabase.com).
2. Mở mục **SQL Editor**.
3. Copy toàn bộ nội dung tệp [20260709000000_init_schema.sql](file:///c:/Users/LENOVO/Downloads/soulmate_journal_v3/soulmate_journal/supabase/migrations/20260709000000_init_schema.sql) dán vào editor và bấm **Run** để khởi tạo các bảng, chính sách bảo mật RLS và seed dữ liệu kế hoạch (Plans).
4. Lấy `SUPABASE_URL` và `SUPABASE_ANON_KEY` điền vào tệp cấu hình `.env` của ứng dụng:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
