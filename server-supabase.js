require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================
// Supabase Configuration
// ============================================================
// Replace these with your actual Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// Check if Supabase credentials are configured
const isSupabaseConfigured = SUPABASE_URL && 
    SUPABASE_URL.startsWith('https://') && 
    SUPABASE_ANON_KEY && 
    SUPABASE_ANON_KEY.length > 10;

let supabase = null;

if (isSupabaseConfigured) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║  ⚠️  Supabase credentials not configured!                                  ║
║                                                                            ║
║  To connect to Supabase, set environment variables:                        ║
║                                                                            ║
║  PowerShell:                                                               ║
║    $env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"                    ║
║    $env:SUPABASE_ANON_KEY="your-anon-key-here"                             ║
║    npm run start:supabase                                                  ║
║                                                                            ║
║  Or edit server-supabase.js line 12-13 directly.                           ║
║                                                                            ║
║  Get your keys from: Supabase Dashboard → Settings → API                   ║
╚════════════════════════════════════════════════════════════════════════════╝
    `);
}

// ============================================================
// Middleware
// ============================================================
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Points System Configuration (for client-side reference)
// ============================================================
const POINTS_CONFIG = {
    research: { Q1: 15, Q2: 12, Q3: 10, Q4: 5, local: 3 },
    patent: { granted: 20, pending: 10 },
    supervision: { phd: 15, masters: 10, graduation: 5 },
    conference: {
        international_presenter: 8,
        international_attendee: 4,
        local_presenter: 5,
        local_attendee: 2
    },
    training: { certified: 5, uncertified: 2 },
    teaching: { course_development: 8, lectures: 3, assessment: 2 }
};

const PROMOTION_REQUIREMENTS = {
    teaching_assistant: { minPoints: 46, maxPoints: 70, nextPosition: 'lecturer' },
    lecturer: { minPoints: 50, maxPoints: 80, nextPosition: 'assistant_professor' },
    assistant_professor: { minPoints: 60, maxPoints: 100, nextPosition: 'associate_professor' }
};

// ============================================================
// Fallback In-Memory Storage (when Supabase is not configured)
// ============================================================
let fallbackData = {
    profile: { name: '', degree: '', currentPosition: 'teaching_assistant', yearsOfService: 0 },
    achievements: { research: [], patents: [], supervision: [], conferences: [], training: [], teaching: [] },
    points: { total: 0, breakdown: { research: 0, patents: 0, supervision: 0, conferences: 0, training: 0, teaching: 0 } },
    wizardCompleted: false,
    promotionStatus: { eligible: false, applicationDate: null, status: 'not_applied' }
};

// ============================================================
// API Routes
// ============================================================

// Get faculty data
app.get('/api/faculty', async (req, res) => {
    // If Supabase not configured, return fallback
    if (!supabase) {
        return res.json(fallbackData);
    }
    
    try {
        const { data, error } = await supabase.rpc('get_default_faculty_data');
        
        if (error) throw error;
        
        // Transform data to match frontend expectations
        const facultyData = {
            profile: {
                name: data.profile?.name || '',
                degree: data.profile?.degree || '',
                currentPosition: data.profile?.current_position || 'teaching_assistant',
                yearsOfService: data.profile?.years_of_service || 0
            },
            achievements: {
                research: (data.achievements?.research || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    journal: item.journal,
                    quartile: item.quartile,
                    points: item.points
                })),
                patents: (data.achievements?.patents || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    number: item.patent_number,
                    status: item.status,
                    points: item.points
                })),
                supervision: (data.achievements?.supervision || []).map(item => ({
                    id: item.id,
                    name: item.student_name,
                    studentName: item.student_name,
                    projectTitle: item.project_title,
                    type: item.supervision_type,
                    points: item.points
                })),
                conferences: (data.achievements?.conferences || []).map(item => ({
                    id: item.id,
                    name: item.title,
                    title: item.title,
                    type: item.conference_type,
                    role: item.role,
                    points: item.points
                })),
                training: (data.achievements?.training || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    provider: item.provider,
                    certified: item.certified,
                    points: item.points
                })),
                teaching: (data.achievements?.teaching || []).map(item => ({
                    id: item.id,
                    title: item.title,
                    type: item.activity_type,
                    points: item.points
                }))
            },
            points: {
                total: data.points?.total || 0,
                breakdown: data.points?.breakdown || {
                    research: 0,
                    patents: 0,
                    supervision: 0,
                    conferences: 0,
                    training: 0,
                    teaching: 0
                }
            },
            wizardCompleted: data.wizardCompleted || false,
            promotionStatus: {
                eligible: data.promotionStatus?.eligible || false,
                applicationDate: null,
                status: 'not_applied'
            }
        };
        
        res.json(facultyData);
    } catch (error) {
        console.error('Error fetching faculty data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get points configuration
app.get('/api/config/points', (req, res) => {
    res.json(POINTS_CONFIG);
});

// Get promotion requirements
app.get('/api/config/requirements', (req, res) => {
    res.json(PROMOTION_REQUIREMENTS);
});

// Save wizard data
app.post('/api/faculty/wizard', async (req, res) => {
    const { profile, achievements } = req.body;
    
    // Fallback mode
    if (!supabase) {
        fallbackData.profile = profile;
        fallbackData.achievements = achievements;
        fallbackData.wizardCompleted = true;
        
        // Calculate points
        let total = 0;
        const breakdown = { research: 0, patents: 0, supervision: 0, conferences: 0, training: 0, teaching: 0 };
        
        (achievements.research || []).forEach(i => { const p = POINTS_CONFIG.research[i.quartile] || 3; breakdown.research += p; total += p; i.points = p; });
        (achievements.patents || []).forEach(i => { const p = POINTS_CONFIG.patent[i.status] || 10; breakdown.patents += p; total += p; i.points = p; });
        (achievements.supervision || []).forEach(i => { const p = POINTS_CONFIG.supervision[i.type] || 5; breakdown.supervision += p; total += p; i.points = p; });
        (achievements.conferences || []).forEach(i => { const k = `${i.type}_${i.role === 'presenter' ? 'presenter' : 'attendee'}`; const p = POINTS_CONFIG.conference[k] || 2; breakdown.conferences += p; total += p; i.points = p; });
        (achievements.training || []).forEach(i => { const p = i.certified ? POINTS_CONFIG.training.certified : POINTS_CONFIG.training.uncertified; breakdown.training += p; total += p; i.points = p; });
        (achievements.teaching || []).forEach(i => { const p = POINTS_CONFIG.teaching[i.type] || 3; breakdown.teaching += p; total += p; i.points = p; });
        
        fallbackData.points = { total, breakdown };
        
        const requirements = PROMOTION_REQUIREMENTS[profile.currentPosition];
        fallbackData.promotionStatus.eligible = total >= (requirements?.minPoints || 0);
        
        return res.json({
            success: true,
            data: fallbackData,
            eligibility: {
                eligible: fallbackData.promotionStatus.eligible,
                currentPoints: total,
                requiredPoints: requirements?.minPoints || 0,
                maxPoints: requirements?.maxPoints || 0,
                pointsNeeded: Math.max(0, (requirements?.minPoints || 0) - total)
            }
        });
    }
    
    try {
        const { data, error } = await supabase.rpc('complete_wizard_public', {
            p_name: profile.name,
            p_degree: profile.degree,
            p_position: profile.currentPosition,
            p_achievements: achievements
        });
        
        if (error) throw error;
        
        const requirements = PROMOTION_REQUIREMENTS[profile.currentPosition];
        const totalPoints = data.points?.total || 0;
        
        res.json({
            success: true,
            data: data,
            eligibility: {
                eligible: totalPoints >= (requirements?.minPoints || 0),
                currentPoints: totalPoints,
                requiredPoints: requirements?.minPoints || 0,
                maxPoints: requirements?.maxPoints || 0,
                pointsNeeded: Math.max(0, (requirements?.minPoints || 0) - totalPoints)
            }
        });
    } catch (error) {
        console.error('Error saving wizard data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update profile
app.post('/api/faculty/profile', async (req, res) => {
    // Fallback mode
    if (!supabase) {
        fallbackData.profile = { ...fallbackData.profile, ...req.body };
        return res.json({ success: true, profile: fallbackData.profile });
    }
    
    try {
        const { data: facultyData } = await supabase.rpc('get_default_faculty_data');
        const facultyId = facultyData.profile?.id;
        
        if (!facultyId) {
            throw new Error('Faculty profile not found');
        }
        
        const { data, error } = await supabase
            .from('faculty_profiles')
            .update({
                name: req.body.name,
                degree: req.body.degree,
                current_position: req.body.currentPosition,
                updated_at: new Date().toISOString()
            })
            .eq('id', facultyId)
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({ success: true, profile: data });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Add achievement
app.post('/api/faculty/achievements/:type', async (req, res) => {
    const { type } = req.params;
    
    // Fallback mode
    if (!supabase) {
        if (!fallbackData.achievements[type]) {
            return res.status(400).json({ success: false, error: 'Invalid achievement type' });
        }
        
        const newItem = { id: Date.now(), ...req.body };
        
        // Calculate points
        let points = 0;
        switch(type) {
            case 'research': points = POINTS_CONFIG.research[req.body.quartile] || 3; break;
            case 'patents': points = POINTS_CONFIG.patent[req.body.status] || 10; break;
            case 'supervision': points = POINTS_CONFIG.supervision[req.body.type] || 5; break;
            case 'conferences': 
                const k = `${req.body.type}_${req.body.role === 'presenter' ? 'presenter' : 'attendee'}`;
                points = POINTS_CONFIG.conference[k] || 2; 
                break;
            case 'training': points = req.body.certified ? POINTS_CONFIG.training.certified : POINTS_CONFIG.training.uncertified; break;
            case 'teaching': points = POINTS_CONFIG.teaching[req.body.type] || 3; break;
        }
        
        newItem.points = points;
        fallbackData.achievements[type].push(newItem);
        fallbackData.points.breakdown[type] = (fallbackData.points.breakdown[type] || 0) + points;
        fallbackData.points.total += points;
        
        const requirements = PROMOTION_REQUIREMENTS[fallbackData.profile.currentPosition];
        fallbackData.promotionStatus.eligible = fallbackData.points.total >= (requirements?.minPoints || 0);
        
        return res.json({
            success: true,
            item: newItem,
            points: fallbackData.points,
            eligible: fallbackData.promotionStatus.eligible
        });
    }
    
    try {
        const { data, error } = await supabase.rpc('add_achievement_public', {
            p_type: type,
            p_data: req.body
        });
        
        if (error) throw error;
        
        if (!data.success) {
            return res.status(400).json({ success: false, error: data.error });
        }
        
        // Get updated faculty data
        const facultyData = data.facultyData;
        
        res.json({
            success: true,
            item: { id: data.id, ...req.body, points: data.points },
            points: {
                total: facultyData.points?.total || 0,
                breakdown: facultyData.points?.breakdown || {}
            },
            eligible: facultyData.promotionStatus?.eligible || false
        });
    } catch (error) {
        console.error('Error adding achievement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete achievement
app.delete('/api/faculty/achievements/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    
    // Fallback mode
    if (!supabase) {
        if (!fallbackData.achievements[type]) {
            return res.status(400).json({ success: false, error: 'Invalid achievement type' });
        }
        
        const itemIndex = fallbackData.achievements[type].findIndex(i => i.id === parseInt(id));
        if (itemIndex > -1) {
            const item = fallbackData.achievements[type][itemIndex];
            const points = item.points || 0;
            fallbackData.achievements[type].splice(itemIndex, 1);
            fallbackData.points.breakdown[type] = Math.max(0, (fallbackData.points.breakdown[type] || 0) - points);
            fallbackData.points.total = Math.max(0, fallbackData.points.total - points);
        }
        
        const requirements = PROMOTION_REQUIREMENTS[fallbackData.profile.currentPosition];
        fallbackData.promotionStatus.eligible = fallbackData.points.total >= (requirements?.minPoints || 0);
        
        return res.json({
            success: true,
            points: fallbackData.points,
            eligible: fallbackData.promotionStatus.eligible
        });
    }
    
    try {
        const { data, error } = await supabase.rpc('delete_achievement_public', {
            p_type: type,
            p_id: parseInt(id)
        });
        
        if (error) throw error;
        
        if (!data.success) {
            return res.status(400).json({ success: false, error: data.error });
        }
        
        const facultyData = data.facultyData;
        
        res.json({
            success: true,
            points: {
                total: facultyData.points?.total || 0,
                breakdown: facultyData.points?.breakdown || {}
            },
            eligible: facultyData.promotionStatus?.eligible || false
        });
    } catch (error) {
        console.error('Error deleting achievement:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Calculate eligibility
app.get('/api/faculty/eligibility', async (req, res) => {
    // Fallback mode
    if (!supabase) {
        const requirements = PROMOTION_REQUIREMENTS[fallbackData.profile.currentPosition];
        return res.json({
            eligible: fallbackData.promotionStatus.eligible,
            currentPoints: fallbackData.points.total,
            requiredPoints: requirements?.minPoints || 0,
            maxPoints: requirements?.maxPoints || 0,
            pointsNeeded: Math.max(0, (requirements?.minPoints || 0) - fallbackData.points.total),
            breakdown: fallbackData.points.breakdown,
            nextPosition: requirements?.nextPosition || ''
        });
    }
    
    try {
        const { data, error } = await supabase.rpc('get_default_faculty_data');
        
        if (error) throw error;
        
        const position = data.profile?.current_position || 'teaching_assistant';
        const requirements = PROMOTION_REQUIREMENTS[position];
        const totalPoints = data.points?.total || 0;
        
        res.json({
            eligible: totalPoints >= (requirements?.minPoints || 0),
            currentPoints: totalPoints,
            requiredPoints: requirements?.minPoints || 0,
            maxPoints: requirements?.maxPoints || 0,
            pointsNeeded: Math.max(0, (requirements?.minPoints || 0) - totalPoints),
            breakdown: data.points?.breakdown || {},
            nextPosition: requirements?.nextPosition || ''
        });
    } catch (error) {
        console.error('Error calculating eligibility:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit promotion application
app.post('/api/faculty/apply', async (req, res) => {
    // Fallback mode
    if (!supabase) {
        if (!fallbackData.promotionStatus.eligible) {
            return res.status(400).json({ success: false, error: 'Not eligible for promotion' });
        }
        
        fallbackData.promotionStatus.applicationDate = new Date().toISOString();
        fallbackData.promotionStatus.status = 'pending';
        
        return res.json({
            success: true,
            status: fallbackData.promotionStatus
        });
    }
    
    try {
        const { data, error } = await supabase.rpc('submit_promotion_public');
        
        if (error) throw error;
        
        if (!data.success) {
            return res.status(400).json({ success: false, error: data.error });
        }
        
        res.json({
            success: true,
            status: {
                applicationId: data.applicationId,
                status: data.status,
                fromPosition: data.fromPosition,
                toPosition: data.toPosition
            }
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reset all data
app.post('/api/faculty/reset', async (req, res) => {
    // Fallback mode
    if (!supabase) {
        fallbackData = {
            profile: { name: '', degree: '', currentPosition: 'teaching_assistant', yearsOfService: 0 },
            achievements: { research: [], patents: [], supervision: [], conferences: [], training: [], teaching: [] },
            points: { total: 0, breakdown: { research: 0, patents: 0, supervision: 0, conferences: 0, training: 0, teaching: 0 } },
            wizardCompleted: false,
            promotionStatus: { eligible: false, applicationDate: null, status: 'not_applied' }
        };
        return res.json({ success: true });
    }
    
    try {
        const { data, error } = await supabase.rpc('reset_default_faculty');
        
        if (error) throw error;
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Simulate points
app.post('/api/faculty/simulate', async (req, res) => {
    const { additions } = req.body;
    
    // Fallback mode
    if (!supabase) {
        let additionalPoints = 0;
        
        (additions.research || []).forEach(i => additionalPoints += POINTS_CONFIG.research[i.quartile] || 3);
        (additions.patents || []).forEach(i => additionalPoints += POINTS_CONFIG.patent[i.status] || 10);
        (additions.supervision || []).forEach(i => additionalPoints += POINTS_CONFIG.supervision[i.type] || 5);
        (additions.conferences || []).forEach(i => {
            const k = `${i.type}_${i.role === 'presenter' ? 'presenter' : 'attendee'}`;
            additionalPoints += POINTS_CONFIG.conference[k] || 2;
        });
        (additions.training || []).forEach(i => additionalPoints += i.certified ? POINTS_CONFIG.training.certified : POINTS_CONFIG.training.uncertified);
        (additions.teaching || []).forEach(i => additionalPoints += POINTS_CONFIG.teaching[i.type] || 3);
        
        const simulatedTotal = fallbackData.points.total + additionalPoints;
        const requirements = PROMOTION_REQUIREMENTS[fallbackData.profile.currentPosition];
        
        return res.json({
            currentPoints: fallbackData.points.total,
            simulatedPoints: simulatedTotal,
            pointsGained: additionalPoints,
            wouldBeEligible: simulatedTotal >= (requirements?.minPoints || 0),
            breakdown: fallbackData.points.breakdown
        });
    }
    
    try {
        const { data, error } = await supabase.rpc('simulate_points_public', {
            p_additions: additions
        });
        
        if (error) throw error;
        
        const { data: facultyData } = await supabase.rpc('get_default_faculty_data');
        const position = facultyData.profile?.current_position || 'teaching_assistant';
        const requirements = PROMOTION_REQUIREMENTS[position];
        
        res.json({
            currentPoints: data.currentPoints || 0,
            simulatedPoints: data.simulatedPoints || 0,
            pointsGained: data.pointsGained || 0,
            wouldBeEligible: (data.simulatedPoints || 0) >= (requirements?.minPoints || 0),
            breakdown: data.breakdown || {}
        });
    } catch (error) {
        console.error('Error simulating points:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    if (!supabase) {
        return res.json({
            status: 'running',
            database: 'not_configured (using in-memory fallback)',
            mode: 'fallback',
            timestamp: new Date().toISOString()
        });
    }
    
    try {
        // Test Supabase connection
        const { data, error } = await supabase.from('points_config').select('count').limit(1);
        
        if (error) throw error;
        
        res.json({
            status: 'healthy',
            database: 'connected',
            mode: 'supabase',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    const mode = isSupabaseConfigured ? 'Supabase' : 'Fallback (In-Memory)';
    
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     PromoTrack - Faculty Promotion System                  ║
║     Server running on http://localhost:${PORT}               ║
║     Mode: ${mode.padEnd(44)}║
╚════════════════════════════════════════════════════════════╝
    `);
    
    // Verify Supabase connection on startup
    if (supabase) {
        supabase.from('points_config').select('count').limit(1)
            .then(({ error }) => {
                if (error) {
                    console.error('⚠️  Warning: Could not connect to Supabase:', error.message);
                    console.log('   Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set correctly.');
                } else {
                    console.log('✅ Successfully connected to Supabase database');
                }
            });
    } else {
        console.log('ℹ️  Running in fallback mode - data will not persist');
        console.log('   Configure Supabase for persistent storage.\n');
    }
});


