-- ============================================================
-- PromoTrack - Faculty Promotion System
-- Supabase Database Schema
-- ============================================================
-- Author: PromoTrack System
-- Version: 1.0
-- Description: Complete database schema for faculty promotion tracking
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS (Type Definitions)
-- ============================================================

-- Degree types
CREATE TYPE degree_type AS ENUM ('masters', 'phd');

-- Academic positions
CREATE TYPE position_type AS ENUM (
    'teaching_assistant',
    'lecturer', 
    'assistant_professor',
    'associate_professor',
    'professor'
);

-- Promotion application status
CREATE TYPE promotion_status_type AS ENUM (
    'not_applied',
    'pending',
    'under_review',
    'approved',
    'rejected'
);

-- Research quartiles
CREATE TYPE quartile_type AS ENUM ('Q1', 'Q2', 'Q3', 'Q4', 'local');

-- Patent status
CREATE TYPE patent_status_type AS ENUM ('granted', 'pending');

-- Supervision types
CREATE TYPE supervision_type AS ENUM ('phd', 'masters', 'graduation');

-- Conference types
CREATE TYPE conference_type AS ENUM ('international', 'local');

-- Conference roles
CREATE TYPE conference_role_type AS ENUM ('presenter', 'attendee', 'keynote', 'organizer');

-- Teaching activity types
CREATE TYPE teaching_type AS ENUM ('course_development', 'lectures', 'assessment', 'curriculum');

-- ============================================================
-- POINTS CONFIGURATION TABLE
-- ============================================================

CREATE TABLE points_config (
    id SERIAL PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category, sub_category)
);

-- Insert default points configuration
INSERT INTO points_config (category, sub_category, points, description) VALUES
-- Research Publications
('research', 'Q1', 15, 'Q1 Journal Publication'),
('research', 'Q2', 12, 'Q2 Journal Publication'),
('research', 'Q3', 10, 'Q3 Journal Publication'),
('research', 'Q4', 5, 'Q4 Journal Publication'),
('research', 'local', 3, 'Local Journal Publication'),
-- Patents
('patent', 'granted', 20, 'Granted Patent'),
('patent', 'pending', 10, 'Pending Patent'),
-- Supervision
('supervision', 'phd', 15, 'Ph.D. Dissertation Supervision'),
('supervision', 'masters', 10, 'Master''s Thesis Supervision'),
('supervision', 'graduation', 5, 'Graduation Project Supervision'),
-- Conferences
('conference', 'international_presenter', 8, 'International Conference Presenter'),
('conference', 'international_attendee', 4, 'International Conference Attendee'),
('conference', 'local_presenter', 5, 'Local Conference Presenter'),
('conference', 'local_attendee', 2, 'Local Conference Attendee'),
-- Training
('training', 'certified', 5, 'Certified Training Course'),
('training', 'uncertified', 2, 'Non-Certified Training Course'),
-- Teaching
('teaching', 'course_development', 8, 'Course Development'),
('teaching', 'lectures', 3, 'Lectures'),
('teaching', 'assessment', 2, 'Assessment Development'),
('teaching', 'curriculum', 8, 'Curriculum Development');

-- ============================================================
-- PROMOTION REQUIREMENTS TABLE
-- ============================================================

CREATE TABLE promotion_requirements (
    id SERIAL PRIMARY KEY,
    current_position position_type NOT NULL UNIQUE,
    next_position position_type NOT NULL,
    min_points INTEGER NOT NULL,
    max_points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default promotion requirements
INSERT INTO promotion_requirements (current_position, next_position, min_points, max_points, description) VALUES
('teaching_assistant', 'lecturer', 46, 70, 'Teaching Assistant to Lecturer promotion'),
('lecturer', 'assistant_professor', 50, 80, 'Lecturer to Assistant Professor promotion'),
('assistant_professor', 'associate_professor', 60, 100, 'Assistant Professor to Associate Professor promotion');

-- ============================================================
-- FACULTY PROFILES TABLE
-- ============================================================

CREATE TABLE faculty_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    degree degree_type NOT NULL,
    current_position position_type NOT NULL DEFAULT 'teaching_assistant',
    department VARCHAR(255),
    years_of_service INTEGER DEFAULT 0,
    wizard_completed BOOLEAN DEFAULT FALSE,
    total_points INTEGER DEFAULT 0,
    is_eligible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_faculty_user_id ON faculty_profiles(user_id);
CREATE INDEX idx_faculty_position ON faculty_profiles(current_position);
CREATE INDEX idx_faculty_eligible ON faculty_profiles(is_eligible);

-- ============================================================
-- PROMOTION APPLICATIONS TABLE
-- ============================================================

CREATE TABLE promotion_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    from_position position_type NOT NULL,
    to_position position_type NOT NULL,
    points_at_application INTEGER NOT NULL,
    status promotion_status_type DEFAULT 'pending',
    application_date TIMESTAMPTZ DEFAULT NOW(),
    review_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_promotion_faculty ON promotion_applications(faculty_id);
CREATE INDEX idx_promotion_status ON promotion_applications(status);

-- ============================================================
-- RESEARCH PAPERS TABLE
-- ============================================================

CREATE TABLE research_papers (
    id BIGSERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    journal VARCHAR(255),
    quartile quartile_type NOT NULL DEFAULT 'local',
    publication_date DATE,
    doi VARCHAR(255),
    co_authors TEXT,
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_research_faculty ON research_papers(faculty_id);
CREATE INDEX idx_research_quartile ON research_papers(quartile);

-- ============================================================
-- PATENTS TABLE
-- ============================================================

CREATE TABLE patents (
    id BIGSERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    patent_number VARCHAR(100),
    status patent_status_type NOT NULL DEFAULT 'pending',
    filing_date DATE,
    grant_date DATE,
    co_inventors TEXT,
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patents_faculty ON patents(faculty_id);
CREATE INDEX idx_patents_status ON patents(status);

-- ============================================================
-- SUPERVISIONS TABLE
-- ============================================================

CREATE TABLE supervisions (
    id BIGSERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    student_name VARCHAR(255) NOT NULL,
    project_title VARCHAR(500),
    supervision_type supervision_type NOT NULL DEFAULT 'graduation',
    start_date DATE,
    completion_date DATE,
    status VARCHAR(50) DEFAULT 'in_progress',
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_supervisions_faculty ON supervisions(faculty_id);
CREATE INDEX idx_supervisions_type ON supervisions(supervision_type);

-- ============================================================
-- CONFERENCES TABLE
-- ============================================================

CREATE TABLE conferences (
    id BIGSERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    conference_type conference_type NOT NULL DEFAULT 'local',
    role conference_role_type NOT NULL DEFAULT 'attendee',
    location VARCHAR(255),
    conference_date DATE,
    paper_title VARCHAR(500),
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conferences_faculty ON conferences(faculty_id);
CREATE INDEX idx_conferences_type ON conferences(conference_type);

-- ============================================================
-- TRAINING COURSES TABLE
-- ============================================================

CREATE TABLE training_courses (
    id BIGSERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    provider VARCHAR(255),
    certified BOOLEAN DEFAULT FALSE,
    certificate_number VARCHAR(100),
    training_date DATE,
    duration_hours INTEGER,
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_training_faculty ON training_courses(faculty_id);
CREATE INDEX idx_training_certified ON training_courses(certified);

-- ============================================================
-- TEACHING ACTIVITIES TABLE
-- ============================================================

CREATE TABLE teaching_activities (
    id BIGSERIAL PRIMARY KEY,
    faculty_id UUID NOT NULL REFERENCES faculty_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    activity_type teaching_type NOT NULL DEFAULT 'lectures',
    description TEXT,
    academic_year VARCHAR(20),
    semester VARCHAR(20),
    points INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_teaching_faculty ON teaching_activities(faculty_id);
CREATE INDEX idx_teaching_type ON teaching_activities(activity_type);

-- ============================================================
-- POINTS BREAKDOWN VIEW
-- ============================================================

CREATE OR REPLACE VIEW faculty_points_breakdown AS
SELECT 
    f.id AS faculty_id,
    f.name,
    f.current_position,
    COALESCE(SUM(r.points), 0) AS research_points,
    COALESCE(SUM(p.points), 0) AS patents_points,
    COALESCE(SUM(s.points), 0) AS supervision_points,
    COALESCE(SUM(c.points), 0) AS conferences_points,
    COALESCE(SUM(t.points), 0) AS training_points,
    COALESCE(SUM(ta.points), 0) AS teaching_points,
    (
        COALESCE(SUM(r.points), 0) + 
        COALESCE(SUM(p.points), 0) + 
        COALESCE(SUM(s.points), 0) + 
        COALESCE(SUM(c.points), 0) + 
        COALESCE(SUM(t.points), 0) + 
        COALESCE(SUM(ta.points), 0)
    ) AS total_points
FROM faculty_profiles f
LEFT JOIN research_papers r ON f.id = r.faculty_id
LEFT JOIN patents p ON f.id = p.faculty_id
LEFT JOIN supervisions s ON f.id = s.faculty_id
LEFT JOIN conferences c ON f.id = c.faculty_id
LEFT JOIN training_courses t ON f.id = t.faculty_id
LEFT JOIN teaching_activities ta ON f.id = ta.faculty_id
GROUP BY f.id, f.name, f.current_position;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to get points for a specific category and sub-category
CREATE OR REPLACE FUNCTION get_points(p_category VARCHAR, p_sub_category VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    v_points INTEGER;
BEGIN
    SELECT points INTO v_points
    FROM points_config
    WHERE category = p_category AND sub_category = p_sub_category;
    
    RETURN COALESCE(v_points, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate total points for a faculty member
CREATE OR REPLACE FUNCTION calculate_faculty_points(p_faculty_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT 
        COALESCE(SUM(points), 0) INTO v_total
    FROM (
        SELECT points FROM research_papers WHERE faculty_id = p_faculty_id
        UNION ALL
        SELECT points FROM patents WHERE faculty_id = p_faculty_id
        UNION ALL
        SELECT points FROM supervisions WHERE faculty_id = p_faculty_id
        UNION ALL
        SELECT points FROM conferences WHERE faculty_id = p_faculty_id
        UNION ALL
        SELECT points FROM training_courses WHERE faculty_id = p_faculty_id
        UNION ALL
        SELECT points FROM teaching_activities WHERE faculty_id = p_faculty_id
    ) AS all_points;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function to get points breakdown for a faculty member
CREATE OR REPLACE FUNCTION get_points_breakdown(p_faculty_id UUID)
RETURNS JSON AS $$
DECLARE
    v_breakdown JSON;
BEGIN
    SELECT json_build_object(
        'research', COALESCE((SELECT SUM(points) FROM research_papers WHERE faculty_id = p_faculty_id), 0),
        'patents', COALESCE((SELECT SUM(points) FROM patents WHERE faculty_id = p_faculty_id), 0),
        'supervision', COALESCE((SELECT SUM(points) FROM supervisions WHERE faculty_id = p_faculty_id), 0),
        'conferences', COALESCE((SELECT SUM(points) FROM conferences WHERE faculty_id = p_faculty_id), 0),
        'training', COALESCE((SELECT SUM(points) FROM training_courses WHERE faculty_id = p_faculty_id), 0),
        'teaching', COALESCE((SELECT SUM(points) FROM teaching_activities WHERE faculty_id = p_faculty_id), 0)
    ) INTO v_breakdown;
    
    RETURN v_breakdown;
END;
$$ LANGUAGE plpgsql;

-- Function to check promotion eligibility
CREATE OR REPLACE FUNCTION check_promotion_eligibility(p_faculty_id UUID)
RETURNS JSON AS $$
DECLARE
    v_position position_type;
    v_total_points INTEGER;
    v_min_points INTEGER;
    v_max_points INTEGER;
    v_next_position position_type;
    v_eligible BOOLEAN;
BEGIN
    -- Get faculty current position
    SELECT current_position INTO v_position
    FROM faculty_profiles
    WHERE id = p_faculty_id;
    
    -- Calculate total points
    v_total_points := calculate_faculty_points(p_faculty_id);
    
    -- Get promotion requirements
    SELECT min_points, max_points, next_position 
    INTO v_min_points, v_max_points, v_next_position
    FROM promotion_requirements
    WHERE current_position = v_position;
    
    -- Check eligibility
    v_eligible := v_total_points >= COALESCE(v_min_points, 999999);
    
    RETURN json_build_object(
        'eligible', v_eligible,
        'currentPoints', v_total_points,
        'requiredPoints', COALESCE(v_min_points, 0),
        'maxPoints', COALESCE(v_max_points, 0),
        'pointsNeeded', GREATEST(0, COALESCE(v_min_points, 0) - v_total_points),
        'nextPosition', v_next_position
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update faculty total points and eligibility
CREATE OR REPLACE FUNCTION update_faculty_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_faculty_id UUID;
    v_total_points INTEGER;
    v_position position_type;
    v_min_points INTEGER;
    v_eligible BOOLEAN;
BEGIN
    -- Get faculty_id based on operation
    IF TG_OP = 'DELETE' THEN
        v_faculty_id := OLD.faculty_id;
    ELSE
        v_faculty_id := NEW.faculty_id;
    END IF;
    
    -- Calculate new total points
    v_total_points := calculate_faculty_points(v_faculty_id);
    
    -- Get current position and requirements
    SELECT current_position INTO v_position
    FROM faculty_profiles
    WHERE id = v_faculty_id;
    
    SELECT min_points INTO v_min_points
    FROM promotion_requirements
    WHERE current_position = v_position;
    
    -- Check eligibility
    v_eligible := v_total_points >= COALESCE(v_min_points, 999999);
    
    -- Update faculty profile
    UPDATE faculty_profiles
    SET 
        total_points = v_total_points,
        is_eligible = v_eligible,
        updated_at = NOW()
    WHERE id = v_faculty_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS FOR AUTO-UPDATING POINTS
-- ============================================================

-- Research papers trigger
CREATE TRIGGER trg_research_points
AFTER INSERT OR UPDATE OR DELETE ON research_papers
FOR EACH ROW EXECUTE FUNCTION update_faculty_stats();

-- Patents trigger
CREATE TRIGGER trg_patents_points
AFTER INSERT OR UPDATE OR DELETE ON patents
FOR EACH ROW EXECUTE FUNCTION update_faculty_stats();

-- Supervisions trigger
CREATE TRIGGER trg_supervisions_points
AFTER INSERT OR UPDATE OR DELETE ON supervisions
FOR EACH ROW EXECUTE FUNCTION update_faculty_stats();

-- Conferences trigger
CREATE TRIGGER trg_conferences_points
AFTER INSERT OR UPDATE OR DELETE ON conferences
FOR EACH ROW EXECUTE FUNCTION update_faculty_stats();

-- Training courses trigger
CREATE TRIGGER trg_training_points
AFTER INSERT OR UPDATE OR DELETE ON training_courses
FOR EACH ROW EXECUTE FUNCTION update_faculty_stats();

-- Teaching activities trigger
CREATE TRIGGER trg_teaching_points
AFTER INSERT OR UPDATE OR DELETE ON teaching_activities
FOR EACH ROW EXECUTE FUNCTION update_faculty_stats();

-- ============================================================
-- TRIGGER FOR AUTO-CALCULATING POINTS ON INSERT
-- ============================================================

-- Function to auto-calculate points for research papers
CREATE OR REPLACE FUNCTION set_research_points()
RETURNS TRIGGER AS $$
BEGIN
    NEW.points := get_points('research', NEW.quartile::VARCHAR);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_research_points
BEFORE INSERT OR UPDATE ON research_papers
FOR EACH ROW EXECUTE FUNCTION set_research_points();

-- Function to auto-calculate points for patents
CREATE OR REPLACE FUNCTION set_patent_points()
RETURNS TRIGGER AS $$
BEGIN
    NEW.points := get_points('patent', NEW.status::VARCHAR);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_patent_points
BEFORE INSERT OR UPDATE ON patents
FOR EACH ROW EXECUTE FUNCTION set_patent_points();

-- Function to auto-calculate points for supervisions
CREATE OR REPLACE FUNCTION set_supervision_points()
RETURNS TRIGGER AS $$
BEGIN
    NEW.points := get_points('supervision', NEW.supervision_type::VARCHAR);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_supervision_points
BEFORE INSERT OR UPDATE ON supervisions
FOR EACH ROW EXECUTE FUNCTION set_supervision_points();

-- Function to auto-calculate points for conferences
CREATE OR REPLACE FUNCTION set_conference_points()
RETURNS TRIGGER AS $$
DECLARE
    v_key VARCHAR;
BEGIN
    v_key := NEW.conference_type::VARCHAR || '_' || 
             CASE 
                 WHEN NEW.role IN ('presenter', 'keynote', 'organizer') THEN 'presenter'
                 ELSE 'attendee'
             END;
    NEW.points := get_points('conference', v_key);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_conference_points
BEFORE INSERT OR UPDATE ON conferences
FOR EACH ROW EXECUTE FUNCTION set_conference_points();

-- Function to auto-calculate points for training
CREATE OR REPLACE FUNCTION set_training_points()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.certified THEN
        NEW.points := get_points('training', 'certified');
    ELSE
        NEW.points := get_points('training', 'uncertified');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_training_points
BEFORE INSERT OR UPDATE ON training_courses
FOR EACH ROW EXECUTE FUNCTION set_training_points();

-- Function to auto-calculate points for teaching
CREATE OR REPLACE FUNCTION set_teaching_points()
RETURNS TRIGGER AS $$
BEGIN
    NEW.points := get_points('teaching', NEW.activity_type::VARCHAR);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_teaching_points
BEFORE INSERT OR UPDATE ON teaching_activities
FOR EACH ROW EXECUTE FUNCTION set_teaching_points();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE faculty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE patents ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_activities ENABLE ROW LEVEL SECURITY;

-- Faculty profiles policies
CREATE POLICY "Users can view their own profile"
ON faculty_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON faculty_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON faculty_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Promotion applications policies
CREATE POLICY "Users can view their own applications"
ON promotion_applications FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert their own applications"
ON promotion_applications FOR INSERT
WITH CHECK (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- Research papers policies
CREATE POLICY "Users can view their own research"
ON research_papers FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own research"
ON research_papers FOR ALL
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- Patents policies
CREATE POLICY "Users can view their own patents"
ON patents FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own patents"
ON patents FOR ALL
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- Supervisions policies
CREATE POLICY "Users can view their own supervisions"
ON supervisions FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own supervisions"
ON supervisions FOR ALL
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- Conferences policies
CREATE POLICY "Users can view their own conferences"
ON conferences FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own conferences"
ON conferences FOR ALL
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- Training courses policies
CREATE POLICY "Users can view their own training"
ON training_courses FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own training"
ON training_courses FOR ALL
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- Teaching activities policies
CREATE POLICY "Users can view their own teaching"
ON teaching_activities FOR SELECT
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their own teaching"
ON teaching_activities FOR ALL
USING (faculty_id IN (SELECT id FROM faculty_profiles WHERE user_id = auth.uid()));

-- ============================================================
-- PUBLIC ACCESS POLICIES (For demo/development without auth)
-- Uncomment these if you want to allow public access
-- ============================================================

/*
-- Allow public read/write for demo purposes
CREATE POLICY "Public access to faculty_profiles"
ON faculty_profiles FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to research_papers"
ON research_papers FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to patents"
ON patents FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to supervisions"
ON supervisions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to conferences"
ON conferences FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to training_courses"
ON training_courses FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to teaching_activities"
ON teaching_activities FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Public access to promotion_applications"
ON promotion_applications FOR ALL
USING (true)
WITH CHECK (true);
*/

-- ============================================================
-- USEFUL STORED PROCEDURES (RPC Functions)
-- ============================================================

-- Get complete faculty data (for API)
CREATE OR REPLACE FUNCTION get_faculty_data(p_faculty_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'profile', (
            SELECT row_to_json(f.*)
            FROM faculty_profiles f
            WHERE f.id = p_faculty_id
        ),
        'points', json_build_object(
            'total', calculate_faculty_points(p_faculty_id),
            'breakdown', get_points_breakdown(p_faculty_id)
        ),
        'achievements', json_build_object(
            'research', (SELECT COALESCE(json_agg(r.*), '[]'::json) FROM research_papers r WHERE r.faculty_id = p_faculty_id),
            'patents', (SELECT COALESCE(json_agg(p.*), '[]'::json) FROM patents p WHERE p.faculty_id = p_faculty_id),
            'supervision', (SELECT COALESCE(json_agg(s.*), '[]'::json) FROM supervisions s WHERE s.faculty_id = p_faculty_id),
            'conferences', (SELECT COALESCE(json_agg(c.*), '[]'::json) FROM conferences c WHERE c.faculty_id = p_faculty_id),
            'training', (SELECT COALESCE(json_agg(t.*), '[]'::json) FROM training_courses t WHERE t.faculty_id = p_faculty_id),
            'teaching', (SELECT COALESCE(json_agg(ta.*), '[]'::json) FROM teaching_activities ta WHERE ta.faculty_id = p_faculty_id)
        ),
        'promotionStatus', check_promotion_eligibility(p_faculty_id),
        'wizardCompleted', (SELECT wizard_completed FROM faculty_profiles WHERE id = p_faculty_id)
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete wizard and save initial data
CREATE OR REPLACE FUNCTION complete_wizard(
    p_user_id UUID,
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
    -- Create or update faculty profile
    INSERT INTO faculty_profiles (user_id, name, degree, current_position, wizard_completed)
    VALUES (p_user_id, p_name, p_degree, p_position, TRUE)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        degree = EXCLUDED.degree,
        current_position = EXCLUDED.current_position,
        wizard_completed = TRUE,
        updated_at = NOW()
    RETURNING id INTO v_faculty_id;
    
    -- Process research papers
    IF p_achievements->'research' IS NOT NULL THEN
        INSERT INTO research_papers (faculty_id, title, quartile, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            (item->>'quartile')::quartile_type,
            0 -- Will be auto-calculated by trigger
        FROM json_array_elements(p_achievements->'research') AS item;
    END IF;
    
    -- Process patents
    IF p_achievements->'patents' IS NOT NULL THEN
        INSERT INTO patents (faculty_id, title, status, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            (item->>'status')::patent_status_type,
            0
        FROM json_array_elements(p_achievements->'patents') AS item;
    END IF;
    
    -- Process supervisions
    IF p_achievements->'supervision' IS NOT NULL THEN
        INSERT INTO supervisions (faculty_id, student_name, supervision_type, points)
        SELECT 
            v_faculty_id,
            COALESCE((item->>'name')::VARCHAR, (item->>'studentName')::VARCHAR, 'Unknown'),
            (item->>'type')::supervision_type,
            0
        FROM json_array_elements(p_achievements->'supervision') AS item;
    END IF;
    
    -- Process conferences
    IF p_achievements->'conferences' IS NOT NULL THEN
        INSERT INTO conferences (faculty_id, title, conference_type, role, points)
        SELECT 
            v_faculty_id,
            COALESCE((item->>'name')::VARCHAR, (item->>'title')::VARCHAR),
            (item->>'type')::conference_type,
            (item->>'role')::conference_role_type,
            0
        FROM json_array_elements(p_achievements->'conferences') AS item;
    END IF;
    
    -- Process training
    IF p_achievements->'training' IS NOT NULL THEN
        INSERT INTO training_courses (faculty_id, title, certified, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            COALESCE((item->>'certified')::BOOLEAN, FALSE),
            0
        FROM json_array_elements(p_achievements->'training') AS item;
    END IF;
    
    -- Process teaching
    IF p_achievements->'teaching' IS NOT NULL THEN
        INSERT INTO teaching_activities (faculty_id, title, activity_type, points)
        SELECT 
            v_faculty_id,
            (item->>'title')::VARCHAR,
            (item->>'type')::teaching_type,
            0
        FROM json_array_elements(p_achievements->'teaching') AS item;
    END IF;
    
    -- Return complete faculty data
    v_result := get_faculty_data(v_faculty_id);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit promotion application
CREATE OR REPLACE FUNCTION submit_promotion_application(p_faculty_id UUID)
RETURNS JSON AS $$
DECLARE
    v_eligibility JSON;
    v_position position_type;
    v_next_position position_type;
    v_total_points INTEGER;
    v_app_id UUID;
BEGIN
    -- Check eligibility
    v_eligibility := check_promotion_eligibility(p_faculty_id);
    
    IF NOT (v_eligibility->>'eligible')::BOOLEAN THEN
        RETURN json_build_object(
            'success', FALSE,
            'error', 'Not eligible for promotion',
            'eligibility', v_eligibility
        );
    END IF;
    
    -- Get current data
    SELECT current_position, total_points
    INTO v_position, v_total_points
    FROM faculty_profiles
    WHERE id = p_faculty_id;
    
    SELECT next_position INTO v_next_position
    FROM promotion_requirements
    WHERE current_position = v_position;
    
    -- Create application
    INSERT INTO promotion_applications (
        faculty_id,
        from_position,
        to_position,
        points_at_application,
        status
    ) VALUES (
        p_faculty_id,
        v_position,
        v_next_position,
        v_total_points,
        'pending'
    ) RETURNING id INTO v_app_id;
    
    RETURN json_build_object(
        'success', TRUE,
        'applicationId', v_app_id,
        'status', 'pending',
        'fromPosition', v_position,
        'toPosition', v_next_position,
        'pointsAtApplication', v_total_points
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset all faculty data
CREATE OR REPLACE FUNCTION reset_faculty_data(p_faculty_id UUID)
RETURNS JSON AS $$
BEGIN
    -- Delete all achievements
    DELETE FROM research_papers WHERE faculty_id = p_faculty_id;
    DELETE FROM patents WHERE faculty_id = p_faculty_id;
    DELETE FROM supervisions WHERE faculty_id = p_faculty_id;
    DELETE FROM conferences WHERE faculty_id = p_faculty_id;
    DELETE FROM training_courses WHERE faculty_id = p_faculty_id;
    DELETE FROM teaching_activities WHERE faculty_id = p_faculty_id;
    DELETE FROM promotion_applications WHERE faculty_id = p_faculty_id;
    
    -- Reset profile
    UPDATE faculty_profiles
    SET 
        wizard_completed = FALSE,
        total_points = 0,
        is_eligible = FALSE,
        updated_at = NOW()
    WHERE id = p_faculty_id;
    
    RETURN json_build_object('success', TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Simulate points addition
CREATE OR REPLACE FUNCTION simulate_points(
    p_faculty_id UUID,
    p_additions JSON
)
RETURNS JSON AS $$
DECLARE
    v_current_points INTEGER;
    v_additional_points INTEGER := 0;
    v_position position_type;
    v_min_points INTEGER;
BEGIN
    -- Get current data
    SELECT total_points, current_position
    INTO v_current_points, v_position
    FROM faculty_profiles
    WHERE id = p_faculty_id;
    
    -- Calculate additional points from research
    IF p_additions->'research' IS NOT NULL THEN
        SELECT COALESCE(SUM(get_points('research', (item->>'quartile')::VARCHAR)), 0)
        INTO v_additional_points
        FROM json_array_elements(p_additions->'research') AS item;
    END IF;
    
    -- Add patents points
    IF p_additions->'patents' IS NOT NULL THEN
        v_additional_points := v_additional_points + (
            SELECT COALESCE(SUM(get_points('patent', (item->>'status')::VARCHAR)), 0)
            FROM json_array_elements(p_additions->'patents') AS item
        );
    END IF;
    
    -- Add supervision points
    IF p_additions->'supervision' IS NOT NULL THEN
        v_additional_points := v_additional_points + (
            SELECT COALESCE(SUM(get_points('supervision', (item->>'type')::VARCHAR)), 0)
            FROM json_array_elements(p_additions->'supervision') AS item
        );
    END IF;
    
    -- Add conference points
    IF p_additions->'conferences' IS NOT NULL THEN
        v_additional_points := v_additional_points + (
            SELECT COALESCE(SUM(
                get_points('conference', 
                    (item->>'type')::VARCHAR || '_' || 
                    CASE WHEN (item->>'role') IN ('presenter', 'keynote', 'organizer') 
                         THEN 'presenter' ELSE 'attendee' END
                )
            ), 0)
            FROM json_array_elements(p_additions->'conferences') AS item
        );
    END IF;
    
    -- Add training points
    IF p_additions->'training' IS NOT NULL THEN
        v_additional_points := v_additional_points + (
            SELECT COALESCE(SUM(
                CASE WHEN (item->>'certified')::BOOLEAN 
                     THEN get_points('training', 'certified')
                     ELSE get_points('training', 'uncertified')
                END
            ), 0)
            FROM json_array_elements(p_additions->'training') AS item
        );
    END IF;
    
    -- Add teaching points
    IF p_additions->'teaching' IS NOT NULL THEN
        v_additional_points := v_additional_points + (
            SELECT COALESCE(SUM(get_points('teaching', (item->>'type')::VARCHAR)), 0)
            FROM json_array_elements(p_additions->'teaching') AS item
        );
    END IF;
    
    -- Get requirements
    SELECT min_points INTO v_min_points
    FROM promotion_requirements
    WHERE current_position = v_position;
    
    RETURN json_build_object(
        'currentPoints', COALESCE(v_current_points, 0),
        'simulatedPoints', COALESCE(v_current_points, 0) + v_additional_points,
        'pointsGained', v_additional_points,
        'wouldBeEligible', (COALESCE(v_current_points, 0) + v_additional_points) >= COALESCE(v_min_points, 0)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GRANT PERMISSIONS
-- ============================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to tables
GRANT SELECT ON points_config TO anon, authenticated;
GRANT SELECT ON promotion_requirements TO anon, authenticated;
GRANT ALL ON faculty_profiles TO authenticated;
GRANT ALL ON promotion_applications TO authenticated;
GRANT ALL ON research_papers TO authenticated;
GRANT ALL ON patents TO authenticated;
GRANT ALL ON supervisions TO authenticated;
GRANT ALL ON conferences TO authenticated;
GRANT ALL ON training_courses TO authenticated;
GRANT ALL ON teaching_activities TO authenticated;

-- Grant access to sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_points(VARCHAR, VARCHAR) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_faculty_points(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_points_breakdown(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_promotion_eligibility(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_faculty_data(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_wizard(UUID, VARCHAR, degree_type, position_type, JSON) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_promotion_application(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reset_faculty_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION simulate_points(UUID, JSON) TO authenticated;

-- ============================================================
-- SAMPLE DATA (For Testing - Optional)
-- ============================================================

/*
-- Uncomment to insert sample data for testing

-- Create a test user profile (replace with actual auth.users id if using auth)
INSERT INTO faculty_profiles (id, name, degree, current_position, wizard_completed)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Dr. Ahmed Al-Rashid',
    'phd',
    'teaching_assistant',
    TRUE
);

-- Add sample research papers
INSERT INTO research_papers (faculty_id, title, journal, quartile, points)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Machine Learning in Healthcare', 'Nature Medicine', 'Q1', 0),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Deep Learning Applications', 'IEEE Access', 'Q2', 0);

-- Add sample patent
INSERT INTO patents (faculty_id, title, patent_number, status, points)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'AI-Based Diagnostic Tool', 'US12345678', 'granted', 0);

-- Add sample supervision
INSERT INTO supervisions (faculty_id, student_name, project_title, supervision_type, points)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Mohammed Ali', 'Neural Network Optimization', 'masters', 0);

-- Add sample conference
INSERT INTO conferences (faculty_id, title, conference_type, role, points)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'IEEE International Conference on AI', 'international', 'presenter', 0);

-- Add sample training
INSERT INTO training_courses (faculty_id, title, provider, certified, points)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Advanced Machine Learning', 'Coursera', TRUE, 0);

-- Add sample teaching activity
INSERT INTO teaching_activities (faculty_id, title, activity_type, points)
VALUES 
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Introduction to AI Course', 'course_development', 0);
*/

-- ============================================================
-- END OF SCHEMA
-- ============================================================


