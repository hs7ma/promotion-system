-- ============================================================
-- PromoTrack - Public Access Policies
-- Run this AFTER the main schema if you want public access
-- (Without requiring Supabase Auth)
-- ============================================================

-- WARNING: Only use this for development/demo purposes
-- In production, use the authenticated policies from the main schema

-- Disable existing RLS policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON faculty_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON faculty_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON faculty_profiles;
DROP POLICY IF EXISTS "Users can view their own applications" ON promotion_applications;
DROP POLICY IF EXISTS "Users can insert their own applications" ON promotion_applications;
DROP POLICY IF EXISTS "Users can view their own research" ON research_papers;
DROP POLICY IF EXISTS "Users can manage their own research" ON research_papers;
DROP POLICY IF EXISTS "Users can view their own patents" ON patents;
DROP POLICY IF EXISTS "Users can manage their own patents" ON patents;
DROP POLICY IF EXISTS "Users can view their own supervisions" ON supervisions;
DROP POLICY IF EXISTS "Users can manage their own supervisions" ON supervisions;
DROP POLICY IF EXISTS "Users can view their own conferences" ON conferences;
DROP POLICY IF EXISTS "Users can manage their own conferences" ON conferences;
DROP POLICY IF EXISTS "Users can view their own training" ON training_courses;
DROP POLICY IF EXISTS "Users can manage their own training" ON training_courses;
DROP POLICY IF EXISTS "Users can view their own teaching" ON teaching_activities;
DROP POLICY IF EXISTS "Users can manage their own teaching" ON teaching_activities;

-- Create public access policies

-- Faculty profiles - full public access
CREATE POLICY "Public read faculty_profiles"
ON faculty_profiles FOR SELECT
USING (true);

CREATE POLICY "Public insert faculty_profiles"
ON faculty_profiles FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update faculty_profiles"
ON faculty_profiles FOR UPDATE
USING (true);

CREATE POLICY "Public delete faculty_profiles"
ON faculty_profiles FOR DELETE
USING (true);

-- Promotion applications - full public access
CREATE POLICY "Public read promotion_applications"
ON promotion_applications FOR SELECT
USING (true);

CREATE POLICY "Public insert promotion_applications"
ON promotion_applications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update promotion_applications"
ON promotion_applications FOR UPDATE
USING (true);

CREATE POLICY "Public delete promotion_applications"
ON promotion_applications FOR DELETE
USING (true);

-- Research papers - full public access
CREATE POLICY "Public read research_papers"
ON research_papers FOR SELECT
USING (true);

CREATE POLICY "Public insert research_papers"
ON research_papers FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update research_papers"
ON research_papers FOR UPDATE
USING (true);

CREATE POLICY "Public delete research_papers"
ON research_papers FOR DELETE
USING (true);

-- Patents - full public access
CREATE POLICY "Public read patents"
ON patents FOR SELECT
USING (true);

CREATE POLICY "Public insert patents"
ON patents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update patents"
ON patents FOR UPDATE
USING (true);

CREATE POLICY "Public delete patents"
ON patents FOR DELETE
USING (true);

-- Supervisions - full public access
CREATE POLICY "Public read supervisions"
ON supervisions FOR SELECT
USING (true);

CREATE POLICY "Public insert supervisions"
ON supervisions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update supervisions"
ON supervisions FOR UPDATE
USING (true);

CREATE POLICY "Public delete supervisions"
ON supervisions FOR DELETE
USING (true);

-- Conferences - full public access
CREATE POLICY "Public read conferences"
ON conferences FOR SELECT
USING (true);

CREATE POLICY "Public insert conferences"
ON conferences FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update conferences"
ON conferences FOR UPDATE
USING (true);

CREATE POLICY "Public delete conferences"
ON conferences FOR DELETE
USING (true);

-- Training courses - full public access
CREATE POLICY "Public read training_courses"
ON training_courses FOR SELECT
USING (true);

CREATE POLICY "Public insert training_courses"
ON training_courses FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update training_courses"
ON training_courses FOR UPDATE
USING (true);

CREATE POLICY "Public delete training_courses"
ON training_courses FOR DELETE
USING (true);

-- Teaching activities - full public access
CREATE POLICY "Public read teaching_activities"
ON teaching_activities FOR SELECT
USING (true);

CREATE POLICY "Public insert teaching_activities"
ON teaching_activities FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public update teaching_activities"
ON teaching_activities FOR UPDATE
USING (true);

CREATE POLICY "Public delete teaching_activities"
ON teaching_activities FOR DELETE
USING (true);

-- Grant anonymous access
GRANT ALL ON faculty_profiles TO anon;
GRANT ALL ON promotion_applications TO anon;
GRANT ALL ON research_papers TO anon;
GRANT ALL ON patents TO anon;
GRANT ALL ON supervisions TO anon;
GRANT ALL ON conferences TO anon;
GRANT ALL ON training_courses TO anon;
GRANT ALL ON teaching_activities TO anon;

-- Grant sequence access to anon
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Grant function execution to anon
GRANT EXECUTE ON FUNCTION complete_wizard(UUID, VARCHAR, degree_type, position_type, JSON) TO anon;
GRANT EXECUTE ON FUNCTION submit_promotion_application(UUID) TO anon;
GRANT EXECUTE ON FUNCTION reset_faculty_data(UUID) TO anon;
GRANT EXECUTE ON FUNCTION simulate_points(UUID, JSON) TO anon;

-- ============================================================
-- Create a default faculty profile for demo (without auth)
-- ============================================================

-- First, modify the faculty_profiles table to allow null user_id
ALTER TABLE faculty_profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE faculty_profiles DROP CONSTRAINT IF EXISTS faculty_profiles_user_id_fkey;

-- Create helper function to get or create default profile
CREATE OR REPLACE FUNCTION get_or_create_default_profile()
RETURNS UUID AS $$
DECLARE
    v_faculty_id UUID;
BEGIN
    -- Check if default profile exists
    SELECT id INTO v_faculty_id
    FROM faculty_profiles
    WHERE user_id IS NULL
    LIMIT 1;
    
    -- If not exists, create one
    IF v_faculty_id IS NULL THEN
        INSERT INTO faculty_profiles (name, degree, current_position, wizard_completed)
        VALUES ('Faculty Member', 'masters', 'teaching_assistant', FALSE)
        RETURNING id INTO v_faculty_id;
    END IF;
    
    RETURN v_faculty_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_or_create_default_profile() TO anon, authenticated;

-- ============================================================
-- Modify complete_wizard for public access
-- ============================================================

CREATE OR REPLACE FUNCTION complete_wizard_public(
    p_name VARCHAR,
    p_degree degree_type,
    p_position position_type,
    p_achievements JSON
)
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
    v_result JSON;
BEGIN
    -- Get or create default profile
    v_faculty_id := get_or_create_default_profile();
    
    -- Clear existing achievements
    DELETE FROM research_papers WHERE faculty_id = v_faculty_id;
    DELETE FROM patents WHERE faculty_id = v_faculty_id;
    DELETE FROM supervisions WHERE faculty_id = v_faculty_id;
    DELETE FROM conferences WHERE faculty_id = v_faculty_id;
    DELETE FROM training_courses WHERE faculty_id = v_faculty_id;
    DELETE FROM teaching_activities WHERE faculty_id = v_faculty_id;
    
    -- Update profile
    UPDATE faculty_profiles
    SET 
        name = p_name,
        degree = p_degree,
        current_position = p_position,
        wizard_completed = TRUE,
        updated_at = NOW()
    WHERE id = v_faculty_id;
    
    -- Process research papers
    IF p_achievements->'research' IS NOT NULL AND json_array_length(p_achievements->'research') > 0 THEN
        INSERT INTO research_papers (faculty_id, title, quartile, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            (item->>'quartile')::quartile_type,
            0
        FROM json_array_elements(p_achievements->'research') AS item
        WHERE item->>'title' IS NOT NULL;
    END IF;
    
    -- Process patents
    IF p_achievements->'patents' IS NOT NULL AND json_array_length(p_achievements->'patents') > 0 THEN
        INSERT INTO patents (faculty_id, title, status, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            (item->>'status')::patent_status_type,
            0
        FROM json_array_elements(p_achievements->'patents') AS item
        WHERE item->>'title' IS NOT NULL;
    END IF;
    
    -- Process supervisions
    IF p_achievements->'supervision' IS NOT NULL AND json_array_length(p_achievements->'supervision') > 0 THEN
        INSERT INTO supervisions (faculty_id, student_name, supervision_type, points)
        SELECT 
            v_faculty_id,
            COALESCE((item->>'name')::VARCHAR, (item->>'studentName')::VARCHAR, 'Student'),
            (item->>'type')::supervision_type,
            0
        FROM json_array_elements(p_achievements->'supervision') AS item;
    END IF;
    
    -- Process conferences
    IF p_achievements->'conferences' IS NOT NULL AND json_array_length(p_achievements->'conferences') > 0 THEN
        INSERT INTO conferences (faculty_id, title, conference_type, role, points)
        SELECT 
            v_faculty_id,
            COALESCE((item->>'name')::VARCHAR, (item->>'title')::VARCHAR, 'Conference'),
            (item->>'type')::conference_type,
            (item->>'role')::conference_role_type,
            0
        FROM json_array_elements(p_achievements->'conferences') AS item;
    END IF;
    
    -- Process training
    IF p_achievements->'training' IS NOT NULL AND json_array_length(p_achievements->'training') > 0 THEN
        INSERT INTO training_courses (faculty_id, title, certified, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            COALESCE((item->>'certified')::BOOLEAN, FALSE),
            0
        FROM json_array_elements(p_achievements->'training') AS item
        WHERE item->>'title' IS NOT NULL;
    END IF;
    
    -- Process teaching
    IF p_achievements->'teaching' IS NOT NULL AND json_array_length(p_achievements->'teaching') > 0 THEN
        INSERT INTO teaching_activities (faculty_id, title, activity_type, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            (item->>'type')::teaching_type,
            0
        FROM json_array_elements(p_achievements->'teaching') AS item
        WHERE item->>'title' IS NOT NULL;
    END IF;
    
    -- Return complete faculty data
    v_result := get_faculty_data(v_faculty_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_wizard_public(VARCHAR, degree_type, position_type, JSON) TO anon, authenticated;

-- ============================================================
-- Get default faculty data (public)
-- ============================================================

CREATE OR REPLACE FUNCTION get_default_faculty_data()
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
BEGIN
    v_faculty_id := get_or_create_default_profile();
    RETURN get_faculty_data(v_faculty_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_default_faculty_data() TO anon, authenticated;

-- ============================================================
-- Reset default faculty (public)
-- ============================================================

CREATE OR REPLACE FUNCTION reset_default_faculty()
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
BEGIN
    v_faculty_id := get_or_create_default_profile();
    RETURN reset_faculty_data(v_faculty_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_default_faculty() TO anon, authenticated;

-- ============================================================
-- Submit promotion (public)
-- ============================================================

CREATE OR REPLACE FUNCTION submit_promotion_public()
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
BEGIN
    v_faculty_id := get_or_create_default_profile();
    RETURN submit_promotion_application(v_faculty_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION submit_promotion_public() TO anon, authenticated;

-- ============================================================
-- Add achievement (public)
-- ============================================================

CREATE OR REPLACE FUNCTION add_achievement_public(
    p_type VARCHAR,
    p_data JSON
)
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
    v_item_id BIGINT;
    v_points INTEGER;
BEGIN
    v_faculty_id := get_or_create_default_profile();
    
    CASE p_type
        WHEN 'research' THEN
            INSERT INTO research_papers (faculty_id, title, journal, quartile, points)
            VALUES (
                v_faculty_id,
                (p_data->>'title')::VARCHAR,
                (p_data->>'journal')::VARCHAR,
                (p_data->>'quartile')::quartile_type,
                0
            )
            RETURNING id, points INTO v_item_id, v_points;
            
        WHEN 'patents' THEN
            INSERT INTO patents (faculty_id, title, patent_number, status, points)
            VALUES (
                v_faculty_id,
                (p_data->>'title')::VARCHAR,
                (p_data->>'number')::VARCHAR,
                (p_data->>'status')::patent_status_type,
                0
            )
            RETURNING id, points INTO v_item_id, v_points;
            
        WHEN 'supervision' THEN
            INSERT INTO supervisions (faculty_id, student_name, project_title, supervision_type, points)
            VALUES (
                v_faculty_id,
                COALESCE((p_data->>'studentName')::VARCHAR, (p_data->>'name')::VARCHAR),
                (p_data->>'projectTitle')::VARCHAR,
                (p_data->>'type')::supervision_type,
                0
            )
            RETURNING id, points INTO v_item_id, v_points;
            
        WHEN 'conferences' THEN
            INSERT INTO conferences (faculty_id, title, conference_type, role, points)
            VALUES (
                v_faculty_id,
                COALESCE((p_data->>'title')::VARCHAR, (p_data->>'name')::VARCHAR),
                (p_data->>'type')::conference_type,
                (p_data->>'role')::conference_role_type,
                0
            )
            RETURNING id, points INTO v_item_id, v_points;
            
        WHEN 'training' THEN
            INSERT INTO training_courses (faculty_id, title, provider, certified, points)
            VALUES (
                v_faculty_id,
                (p_data->>'title')::VARCHAR,
                (p_data->>'provider')::VARCHAR,
                COALESCE((p_data->>'certified')::BOOLEAN, FALSE),
                0
            )
            RETURNING id, points INTO v_item_id, v_points;
            
        WHEN 'teaching' THEN
            INSERT INTO teaching_activities (faculty_id, title, activity_type, points)
            VALUES (
                v_faculty_id,
                (p_data->>'title')::VARCHAR,
                (p_data->>'type')::teaching_type,
                0
            )
            RETURNING id, points INTO v_item_id, v_points;
            
        ELSE
            RETURN json_build_object('success', FALSE, 'error', 'Invalid achievement type');
    END CASE;
    
    -- Get updated points
    SELECT points INTO v_points
    FROM (
        SELECT points FROM research_papers WHERE id = v_item_id AND 'research' = p_type
        UNION ALL
        SELECT points FROM patents WHERE id = v_item_id AND 'patents' = p_type
        UNION ALL
        SELECT points FROM supervisions WHERE id = v_item_id AND 'supervision' = p_type
        UNION ALL
        SELECT points FROM conferences WHERE id = v_item_id AND 'conferences' = p_type
        UNION ALL
        SELECT points FROM training_courses WHERE id = v_item_id AND 'training' = p_type
        UNION ALL
        SELECT points FROM teaching_activities WHERE id = v_item_id AND 'teaching' = p_type
    ) AS all_items
    LIMIT 1;
    
    RETURN json_build_object(
        'success', TRUE,
        'id', v_item_id,
        'points', v_points,
        'facultyData', get_faculty_data(v_faculty_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_achievement_public(VARCHAR, JSON) TO anon, authenticated;

-- ============================================================
-- Delete achievement (public)
-- ============================================================

CREATE OR REPLACE FUNCTION delete_achievement_public(
    p_type VARCHAR,
    p_id BIGINT
)
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
BEGIN
    v_faculty_id := get_or_create_default_profile();
    
    CASE p_type
        WHEN 'research' THEN
            DELETE FROM research_papers WHERE id = p_id AND faculty_id = v_faculty_id;
        WHEN 'patents' THEN
            DELETE FROM patents WHERE id = p_id AND faculty_id = v_faculty_id;
        WHEN 'supervision' THEN
            DELETE FROM supervisions WHERE id = p_id AND faculty_id = v_faculty_id;
        WHEN 'conferences' THEN
            DELETE FROM conferences WHERE id = p_id AND faculty_id = v_faculty_id;
        WHEN 'training' THEN
            DELETE FROM training_courses WHERE id = p_id AND faculty_id = v_faculty_id;
        WHEN 'teaching' THEN
            DELETE FROM teaching_activities WHERE id = p_id AND faculty_id = v_faculty_id;
        ELSE
            RETURN json_build_object('success', FALSE, 'error', 'Invalid achievement type');
    END CASE;
    
    RETURN json_build_object(
        'success', TRUE,
        'facultyData', get_faculty_data(v_faculty_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_achievement_public(VARCHAR, BIGINT) TO anon, authenticated;

-- ============================================================
-- Simulate points (public)
-- ============================================================

CREATE OR REPLACE FUNCTION simulate_points_public(p_additions JSON)
RETURNS JSON AS $$
DECLARE
    v_faculty_id UUID;
BEGIN
    v_faculty_id := get_or_create_default_profile();
    RETURN simulate_points(v_faculty_id, p_additions);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION simulate_points_public(JSON) TO anon, authenticated;

-- ============================================================
-- END OF PUBLIC ACCESS POLICIES
-- ============================================================


