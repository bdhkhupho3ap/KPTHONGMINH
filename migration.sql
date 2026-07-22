-- ====================================================================
-- MIGRATION: HOUSEHOLD-BASED MANAGEMENT SYSTEM
-- ====================================================================

BEGIN;

-- 1. KÍCH HOẠT EXTENSION PHỤC VỤ SO SÁNH MỜ
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- 2. TẠO HÀM BỎ DẤU TIẾNG VIỆT
CREATE OR REPLACE FUNCTION public.remove_vietnamese_accents(str TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    IF str IS NULL THEN
        RETURN NULL;
    END IF;
    result := str;
    result := translate(result, 'áàảãạăắằẳẵặâấầẩẫậÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬ', 'aaaaaaaaaaaaaaaaaAAAAAAAAAAAAAAAAA');
    result := translate(result, 'éèẻẽẹêếềểễệÉÈẺẼẸÊẾỀỂỄỆ', 'eeeeeeeeeeeEEEEEEEEEEE');
    result := translate(result, 'íìỉĩịÍÌỈĨỊ', 'iiiiiIIIII');
    result := translate(result, 'óòỏõọôốồổỗộơớờởỡợÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢ', 'oooooooooooooooooOOOOOOOOOOOOOOOOO');
    result := translate(result, 'úùủũụưứừửữựÚÙỦŨỤƯỨỪỬỮỰ', 'uuuuuuuuuuuUUUUUUUUUUU');
    result := translate(result, 'ýỳỷỹỵÝỲỶỸỴ', 'yyyyyYYYYY');
    result := translate(result, 'đĐ', 'dD');
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. TẠO HÀM CHUẨN HÓA ĐỊA CHỈ (ADDRESS NORMALIZATION ENGINE)
CREATE OR REPLACE FUNCTION public.normalize_address(addr TEXT)
RETURNS TEXT AS $$
DECLARE
    clean TEXT;
BEGIN
    IF addr IS NULL THEN
        RETURN '';
    END IF;
    
    -- Chuyển sang IN HOA và Bỏ dấu
    clean := upper(public.remove_vietnamese_accents(addr));
    
    -- Giữ lại chữ, số, và dấu gạch chéo /, thay các ký tự khác (phẩy, chấm, gạch ngang) bằng dấu cách
    clean := regexp_replace(clean, '[^A-Z0-9/]', ' ', 'g');
    
    -- Loại bỏ "SO NHA", "SO", "DIA CHI"
    clean := regexp_replace(clean, '\b(SO NHA|SO|DIA CHI)\b', ' ', 'g');
    
    -- Loại bỏ "TO <số>" (ví dụ: TO 02, TO 2)
    clean := regexp_replace(clean, '\bTO\s+\d+\b', ' ', 'g');
    
    -- Chuẩn hóa Khu phố: KHU PHO <số> hoặc KP <số> -> KP<số>
    clean := regexp_replace(clean, '\b(KHU PHO|KP)\s*(\d+)\b', 'KP\2', 'g');
    clean := regexp_replace(clean, '\b(KHU PHO|KP)\b', ' ', 'g');
    
    -- Chuẩn hóa Phường: PHUONG <tên> hoặc P <tên> -> <tên>
    clean := regexp_replace(clean, '\b(PHUONG|P)\s+(\w+)\b', '\2', 'g');
    clean := regexp_replace(clean, '\b(PHUONG|P)\b', ' ', 'g');
    
    -- Chuẩn hóa Đường: DUONG <tên> hoặc D <tên> -> D <tên>
    clean := regexp_replace(clean, '\b(DUONG|D)\b', 'D', 'g');
    -- Triệt tiêu lặp "D D2" thành "D2", "D D1" thành "D1"
    clean := regexp_replace(clean, '\bD\s+D(\d+)\b', 'D\1', 'g');
    clean := regexp_replace(clean, '\bD\s+D\b', 'D', 'g');
    
    -- Gộp viết liền các địa danh phổ biến để so sánh mờ tối ưu
    clean := regexp_replace(clean, '\bAN PHU\b', 'ANPHU', 'g');
    clean := regexp_replace(clean, '\bAN KHANH\b', 'ANKHANH', 'g');
    clean := regexp_replace(clean, '\bTHU DUC\b', 'THUDUC', 'g');
    clean := regexp_replace(clean, '\bTHANH PHO HO CHI MINH\b', ' ', 'g');
    clean := regexp_replace(clean, '\bTP HCM\b', ' ', 'g');
    clean := regexp_replace(clean, '\bTP\.HCM\b', ' ', 'g');
    clean := regexp_replace(clean, '\bHCM\b', ' ', 'g');
    clean := regexp_replace(clean, '\bSAI GON\b', ' ', 'g');
    clean := regexp_replace(clean, '\bTINH\b', ' ', 'g');
    clean := regexp_replace(clean, '\bVIET NAM\b', ' ', 'g');
    clean := regexp_replace(clean, '\bVIETNAM\b', ' ', 'g');
    clean := regexp_replace(clean, '\bDONG NAI\b', 'DONGNAI', 'g');
    
    -- Thu gọn dấu cách thừa
    clean := regexp_replace(clean, '\s+', ' ', 'g');
    clean := trim(clean);
    
    RETURN clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3b. HÀM TÍNH ĐỘ TƯƠNG ĐỒNG ĐỊA CHỈ HỖ TRỢ ĐỊA CHỈ RÚT GỌN (CHỈ CÓ SỐ NHÀ)
CREATE OR REPLACE FUNCTION public.get_address_similarity(norm1 TEXT, norm2 TEXT)
RETURNS NUMERIC AS $$
DECLARE
    tokens1 TEXT[];
    tokens2 TEXT[];
    rest1 TEXT := '';
    rest2 TEXT := '';
    street1 TEXT;
    street2 TEXT;
    dist INTEGER;
    max_len INTEGER;
BEGIN
    IF norm1 = norm2 THEN
        RETURN 1.0;
    END IF;
    
    tokens1 := regexp_split_to_array(norm1, '\s+');
    tokens2 := regexp_split_to_array(norm2, '\s+');
    
    -- Nếu số nhà (token đầu tiên, ví dụ "42/3" vs "42/3A") khác nhau, trả về 0.0
    IF array_length(tokens1, 1) >= 1 AND array_length(tokens2, 1) >= 1 AND tokens1[1] <> tokens2[1] THEN
        RETURN 0.0;
    END IF;
    
    -- Kiểm tra nếu số nhà khớp nhau (token đầu tiên)
    IF array_length(tokens1, 1) >= 1 AND array_length(tokens2, 1) >= 1 AND tokens1[1] = tokens2[1] THEN
        IF array_length(tokens1, 1) > 1 THEN
            rest1 := array_to_string(tokens1[2:], ' ');
        END IF;
        IF array_length(tokens2, 1) > 1 THEN
            rest2 := array_to_string(tokens2[2:], ' ');
        END IF;
        
        -- Nếu một bên chỉ có số nhà (ví dụ "57/B1")
        IF rest1 = '' OR rest2 = '' THEN
            RETURN 1.0;
        END IF;
        
        -- Trích xuất tên đường dạng D<số>
        street1 := substring(norm1 from 'D\d+');
        street2 := substring(norm2 from 'D\d+');
        
        IF street1 IS NOT NULL AND street2 IS NOT NULL AND street1 <> street2 THEN
            RETURN 0.0;
        END IF;
        
        -- Nếu chuỗi con của bên này chứa bên kia
        IF position(rest2 in rest1) > 0 OR position(rest1 in rest2) > 0 THEN
            RETURN 1.0;
        END IF;
    END IF;
    
    max_len := greatest(length(norm1), length(norm2));
    IF max_len = 0 THEN
        RETURN 1.0;
    END IF;
    
    dist := levenshtein(norm1, norm2);
    RETURN 1.0 - (dist::numeric / max_len);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. SAO LƯU AN TOÀN DỮ LIỆU CŨ TRƯỚC KHI THỰC HIỆN BIẾN ĐỘNG CSDL
CREATE TABLE IF NOT EXISTS public.backup_residents AS 
SELECT * FROM public.residents;

CREATE TABLE IF NOT EXISTS public.backup_households AS 
SELECT * FROM public.households;

-- 5. TẠO CÁC BẢNG MỚI ĐÚNG THEO YÊU CẦU THIẾT KẾ
CREATE TABLE IF NOT EXISTS public."Household" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_code VARCHAR(50) UNIQUE,
  normalized_address TEXT NOT NULL,
  display_address TEXT NOT NULL,
  gps VARCHAR(100),
  head_person_id VARCHAR(50),
  member_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Hoạt động',
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public."Person" (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  dob VARCHAR(50),
  gender VARCHAR(10),
  "idCard" VARCHAR(50),
  phone VARCHAR(50),
  status VARCHAR(50),
  occupation VARCHAR(255),
  address TEXT,
  household_id UUID REFERENCES public."Household"(id) ON DELETE SET NULL,
  normalized_address TEXT,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Thêm khóa ngoại cho Household tham chiếu Person(id) sau khi bảng Person đã được tạo (idempotent)
ALTER TABLE public."Household" DROP CONSTRAINT IF EXISTS fk_head_person;
ALTER TABLE public."Household" 
ADD CONSTRAINT fk_head_person 
FOREIGN KEY (head_person_id) REFERENCES public."Person"(id) ON DELETE SET NULL;

-- Làm trống các bảng đích trước khi nạp dữ liệu để tránh lỗi trùng lặp khóa chính khi chạy lại
TRUNCATE TABLE public."Person", public."Household" CASCADE;

-- 6. TIẾN HÀNH MIGRATION: CHUỂN ĐỔI VÀ GỘP HỘ
-- Chúng ta dùng PL/pgSQL để phân tích và sinh Hộ gia đình tự động
DO $$
DECLARE
    r RECORD;
    h_id UUID;
    p_id VARCHAR(50);
    norm_addr TEXT;
    h_code VARCHAR(50);
    household_index INTEGER := 1;
    head_id VARCHAR(50);
    m_count INTEGER;
    gps_coords VARCHAR(100);
    disp_addr TEXT;
    exist_h_id UUID;
    exist_h_sim NUMERIC;
    best_match_h_id UUID;
    best_match_sim NUMERIC;
BEGIN
    -- Vòng lặp duyệt qua từng nhân khẩu trong bảng sao lưu
    FOR r IN (
        SELECT id, name, dob, gender, "idCard", phone, status, occupation, address, "householdId", note, created_at 
        FROM public.backup_residents
    ) LOOP
        -- Tính địa chỉ chuẩn hóa của nhân khẩu
        norm_addr := public.normalize_address(r.address);
        
        -- Quét tìm Hộ đã tạo có độ tương đồng địa chỉ >= 95%
        best_match_h_id := NULL;
        best_match_sim := 0.0;
        
        FOR exist_h_id, exist_h_sim IN (
            SELECT id, public.get_address_similarity(norm_addr, normalized_address)
            FROM public."Household"
            WHERE length(norm_addr) > 0 AND length(normalized_address) > 0
        ) LOOP
            IF exist_h_sim >= 0.95 AND exist_h_sim > best_match_sim THEN
                best_match_h_id := exist_h_id;
                best_match_sim := exist_h_sim;
            END IF;
        END LOOP;

        IF best_match_h_id IS NOT NULL THEN
            -- Hộ đã tồn tại (hoặc tương đồng >= 95%): Gộp vào hộ này
            h_id := best_match_h_id;
        ELSE
            -- Chưa có hộ tương đồng: Lập hộ mới
            h_id := gen_random_uuid();
            h_code := 'HK-' || lpad(household_index::text, 6, '0');
            household_index := household_index + 1;
            
            -- Lấy địa chỉ hiển thị và định vị mặc định từ hộ cũ hoặc nhân khẩu đầu tiên
            SELECT 
              CASE 
                WHEN location IS NULL THEN '10.935556, 106.743889'
                ELSE regexp_replace(ST_AsText(location), 'POINT\(([0-9.-]+) ([0-9.-]+)\)', '\2, \1')
              END
            INTO gps_coords 
            FROM public.backup_households 
            WHERE code = r."householdId" 
            LIMIT 1;
            
            IF gps_coords IS NULL THEN
                gps_coords := '10.935556, 106.743889';
            END IF;

            INSERT INTO public."Household" (id, household_code, normalized_address, display_address, gps, status, created_at)
            VALUES (h_id, h_code, norm_addr, r.address, gps_coords, 'Hoạt động', r.created_at);
        END IF;

        -- Thêm nhân khẩu vào bảng Person mới
        INSERT INTO public."Person" (id, name, dob, gender, "idCard", phone, status, occupation, address, household_id, normalized_address, note, created_at)
        VALUES (r.id, r.name, r.dob, r.gender, r."idCard", r.phone, r.status, r.occupation, r.address, h_id, norm_addr, r.note, r.created_at);
    END LOOP;

    -- 7. CHỌN CHỦ HỘ VÀ CẬP NHẬT THÀNH VIÊN CHO TỪNG HỘ ĐÃ SINH
    FOR h_id IN (SELECT id FROM public."Household") LOOP
        -- Tìm chủ hộ theo thứ tự ưu tiên:
        -- 1. Có note ghi "Chủ hộ"
        -- 2. Lớn tuổi nhất (parse năm sinh từ dob dạng DD/MM/YYYY)
        -- 3. Thường trú
        -- 4. Nhập đầu tiên
        SELECT id INTO head_id
        FROM public."Person"
        WHERE household_id = h_id
        ORDER BY 
            CASE WHEN note LIKE '%Chủ hộ%' OR note LIKE '%Quan hệ: Chủ hộ%' THEN 0 ELSE 1 END,
            -- Trích xuất năm sinh từ dob
            COALESCE(
              NULLIF(regexp_replace(dob, '^\d{2}/\d{2}/(\d{4})$', '\1'), dob)::integer, 
              1900
            ) ASC,
            CASE WHEN status = 'Thường trú' THEN 0 ELSE 1 END,
            created_at ASC
        LIMIT 1;
        
        -- Tính tổng số thành viên của hộ
        SELECT count(*) INTO m_count 
        FROM public."Person" 
        WHERE household_id = h_id;
        
        -- Cập nhật thông tin chủ hộ và số lượng thành viên
        UPDATE public."Household"
        SET head_person_id = head_id, member_count = m_count
        WHERE id = h_id;
    END LOOP;
END $$;

COMMIT;

-- ====================================================================
-- CÂU LỆNH ROLLBACK (HỦY BỎ BIẾN ĐỘNG - CHẠY KHI GẶP SỰ CỐ)
-- ====================================================================
/*
BEGIN;
ALTER TABLE public."Household" DROP CONSTRAINT IF EXISTS fk_head_person;
DROP TABLE IF EXISTS public."Person" CASCADE;
DROP TABLE IF EXISTS public."Household" CASCADE;

-- Khôi phục lại dữ liệu ban đầu từ bảng Backup
TRUNCATE TABLE public.residents, public.households CASCADE;
INSERT INTO public.households SELECT * FROM public.backup_households;
INSERT INTO public.residents SELECT * FROM public.backup_residents;

DROP TABLE IF EXISTS public.backup_residents CASCADE;
DROP TABLE IF EXISTS public.backup_households CASCADE;
COMMIT;
*/
