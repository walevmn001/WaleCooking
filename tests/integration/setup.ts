import 'dotenv/config';

// Test tích hợp cần `TEST_DATABASE_URL`. Nạp `.env` (nếu có) trước khi chạy.
if (!process.env.TEST_DATABASE_URL) {
  // Không ném ở đây để file này còn dùng chung; helper sẽ báo lỗi rõ ràng.
  console.warn('[integration] Chưa có TEST_DATABASE_URL trong môi trường/.env.');
}
