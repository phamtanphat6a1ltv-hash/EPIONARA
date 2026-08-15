import { createClient, SupabaseClient as SupabaseJSClient } from "@supabase/supabase-js";

const URL_ENV = (import.meta as any).env?.VITE_SUPABASE_URL || "";
const KEY_ENV = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseJSClient | null = (URL_ENV && KEY_ENV)
  ? createClient(URL_ENV, KEY_ENV)
  : null;

export const SupabaseClient = {
  isEnabled: (): boolean => {
    return !!supabase;
  },

  /**
   * Lấy toàn bộ bản ghi của người dùng từ bảng
   * @param tableName - Tên bảng trong database
   * @param userId - ID người dùng cần lọc
   * @returns Mảng các bản ghi lấy từ db
   */
  fetchRecords: async (tableName: string, userId: string | number): Promise<any[]> => {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", String(userId));

      if (error) {
        console.warn(`[SupabaseClient] Lấy dữ liệu bảng ${tableName} thất bại:`, error.message);
        return [];
      }
      return data || [];
    } catch (e: any) {
      console.warn(`[SupabaseClient] Lỗi kết nối Supabase khi đọc bảng ${tableName}:`, e.message);
      return [];
    }
  },

  /**
   * Insert hoặc Update bản ghi (Upsert)
   * @param tableName - Tên bảng trong database
   * @param record - Dữ liệu bản ghi cần lưu
   * @returns True nếu thành công, ngược lại là false
   */
  upsertRecord: async (tableName: string, record: any): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from(tableName)
        .upsert(record);

      if (error) {
        console.warn(`[SupabaseClient] Lưu dữ liệu vào bảng ${tableName} thất bại:`, error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn(`[SupabaseClient] Lỗi kết nối Supabase khi lưu bảng ${tableName}:`, e.message);
      return false;
    }
  },

  /**
   * Xóa bản ghi theo ID
   * @param tableName - Tên bảng trong database
   * @param id - ID của bản ghi cần xóa
   * @returns True nếu thành công, ngược lại là false
   */
  deleteRecord: async (tableName: string, id: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);

      if (error) {
        console.warn(`[SupabaseClient] Xóa bản ghi trong bảng ${tableName} thất bại:`, error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      console.warn(`[SupabaseClient] Lỗi kết nối Supabase khi xóa bảng ${tableName}:`, e.message);
      return false;
    }
  }
};
