const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Points System Configuration
const POINTS_CONFIG = {
    // Research Publications
    research: {
        Q1: 15,
        Q2: 12,
        Q3: 10,
        Q4: 5,
        local: 3
    },
    // Patents
    patent: {
        granted: 20,
        pending: 10
    },
    // Supervision
    supervision: {
        phd: 15,
        masters: 10,
        graduation: 5
    },
    // Conferences
    conference: {
        international_presenter: 8,
        international_attendee: 4,
        local_presenter: 5,
        local_attendee: 2
    },
    // Training
    training: {
        certified: 5,
        uncertified: 2
    },
    // Teaching
    teaching: {
        course_development: 8,
        lectures: 3,
        assessment: 2
    }
};

// Promotion Requirements
const PROMOTION_REQUIREMENTS = {
    teaching_assistant: {
        minPoints: 46,
        maxPoints: 70,
        nextPosition: 'lecturer'
    },
    lecturer: {
        minPoints: 50,
        maxPoints: 80,
        nextPosition: 'assistant_professor'
    },
    assistant_professor: {
        minPoints: 60,
        maxPoints: 100,
        nextPosition: 'associate_professor'
    }
};

// In-memory storage
let facultyData = {
    profile: {
        name: '',
        degree: '',
        currentPosition: '',
        yearsOfService: 0
    },
    achievements: {
        research: [],
        patents: [],
        supervision: [],
        conferences: [],
        training: [],
        teaching: []
    },
    points: {
        total: 0,
        breakdown: {}
    },
    wizardCompleted: false,
    promotionStatus: {
        eligible: false,
        applicationDate: null,
        status: 'not_applied'
    }
};

// API Routes

// Get all faculty data
app.get('/api/faculty', (req, res) => {
    res.json(facultyData);
});

// Get points configuration
app.get('/api/config/points', (req, res) => {
    res.json(POINTS_CONFIG);
});

// Get promotion requirements
app.get('/api/config/requirements', (req, res) => {
    res.json(PROMOTION_REQUIREMENTS);
});

// Save wizard data (complete profile setup)
app.post('/api/faculty/wizard', (req, res) => {
    const { profile, achievements } = req.body;
    
    facultyData.profile = profile;
    facultyData.achievements = achievements;
    facultyData.wizardCompleted = true;
    
    // Calculate points
    const pointsResult = calculatePoints(achievements);
    facultyData.points = pointsResult;
    
    // Check eligibility
    const requirements = PROMOTION_REQUIREMENTS[profile.currentPosition];
    if (requirements) {
        facultyData.promotionStatus.eligible = pointsResult.total >= requirements.minPoints;
    }
    
    res.json({
        success: true,
        data: facultyData,
        eligibility: {
            eligible: facultyData.promotionStatus.eligible,
            currentPoints: pointsResult.total,
            requiredPoints: requirements?.minPoints || 0,
            maxPoints: requirements?.maxPoints || 0,
            pointsNeeded: Math.max(0, (requirements?.minPoints || 0) - pointsResult.total)
        }
    });
});

// Update profile
app.post('/api/faculty/profile', (req, res) => {
    facultyData.profile = { ...facultyData.profile, ...req.body };
    res.json({ success: true, profile: facultyData.profile });
});

// Add achievement
app.post('/api/faculty/achievements/:type', (req, res) => {
    const { type } = req.params;
    if (facultyData.achievements[type]) {
        const newItem = { id: Date.now(), ...req.body };
        facultyData.achievements[type].push(newItem);
        
        // Recalculate points
        facultyData.points = calculatePoints(facultyData.achievements);
        
        // Check eligibility
        const requirements = PROMOTION_REQUIREMENTS[facultyData.profile.currentPosition];
        if (requirements) {
            facultyData.promotionStatus.eligible = facultyData.points.total >= requirements.minPoints;
        }
        
        res.json({ 
            success: true, 
            item: newItem,
            points: facultyData.points,
            eligible: facultyData.promotionStatus.eligible
        });
    } else {
        res.status(400).json({ success: false, error: 'Invalid achievement type' });
    }
});

// Delete achievement
app.delete('/api/faculty/achievements/:type/:id', (req, res) => {
    const { type, id } = req.params;
    if (facultyData.achievements[type]) {
        facultyData.achievements[type] = facultyData.achievements[type].filter(
            item => item.id !== parseInt(id)
        );
        
        // Recalculate points
        facultyData.points = calculatePoints(facultyData.achievements);
        
        // Check eligibility
        const requirements = PROMOTION_REQUIREMENTS[facultyData.profile.currentPosition];
        if (requirements) {
            facultyData.promotionStatus.eligible = facultyData.points.total >= requirements.minPoints;
        }
        
        res.json({ 
            success: true,
            points: facultyData.points,
            eligible: facultyData.promotionStatus.eligible
        });
    } else {
        res.status(400).json({ success: false, error: 'Invalid achievement type' });
    }
});

// Calculate eligibility
app.get('/api/faculty/eligibility', (req, res) => {
    const requirements = PROMOTION_REQUIREMENTS[facultyData.profile.currentPosition];
    
    res.json({
        eligible: facultyData.promotionStatus.eligible,
        currentPoints: facultyData.points.total,
        requiredPoints: requirements?.minPoints || 0,
        maxPoints: requirements?.maxPoints || 0,
        pointsNeeded: Math.max(0, (requirements?.minPoints || 0) - facultyData.points.total),
        breakdown: facultyData.points.breakdown,
        nextPosition: requirements?.nextPosition || ''
    });
});

// Submit promotion application
app.post('/api/faculty/apply', (req, res) => {
    if (!facultyData.promotionStatus.eligible) {
        return res.status(400).json({ 
            success: false, 
            error: 'Not eligible for promotion' 
        });
    }
    
    facultyData.promotionStatus = {
        ...facultyData.promotionStatus,
        applicationDate: new Date().toISOString(),
        status: 'pending'
    };
    res.json({ success: true, status: facultyData.promotionStatus });
});

// Reset all data
app.post('/api/faculty/reset', (req, res) => {
    facultyData = {
        profile: {
            name: '',
            degree: '',
            currentPosition: '',
            yearsOfService: 0
        },
        achievements: {
            research: [],
            patents: [],
            supervision: [],
            conferences: [],
            training: [],
            teaching: []
        },
        points: {
            total: 0,
            breakdown: {}
        },
        wizardCompleted: false,
        promotionStatus: {
            eligible: false,
            applicationDate: null,
            status: 'not_applied'
        }
    };
    res.json({ success: true });
});

// Points calculation function
function calculatePoints(achievements) {
    let total = 0;
    const breakdown = {
        research: 0,
        patents: 0,
        supervision: 0,
        conferences: 0,
        training: 0,
        teaching: 0
    };
    
    // Research points
    if (achievements.research) {
        achievements.research.forEach(item => {
            const points = POINTS_CONFIG.research[item.quartile] || POINTS_CONFIG.research.local;
            breakdown.research += points;
            total += points;
        });
    }
    
    // Patent points
    if (achievements.patents) {
        achievements.patents.forEach(item => {
            const points = item.status === 'granted' 
                ? POINTS_CONFIG.patent.granted 
                : POINTS_CONFIG.patent.pending;
            breakdown.patents += points;
            total += points;
        });
    }
    
    // Supervision points
    if (achievements.supervision) {
        achievements.supervision.forEach(item => {
            const points = POINTS_CONFIG.supervision[item.type] || POINTS_CONFIG.supervision.graduation;
            breakdown.supervision += points;
            total += points;
        });
    }
    
    // Conference points
    if (achievements.conferences) {
        achievements.conferences.forEach(item => {
            let pointKey = `${item.type}_${item.role}`;
            if (item.role === 'presenter' || item.role === 'keynote' || item.role === 'organizer') {
                pointKey = `${item.type}_presenter`;
            } else {
                pointKey = `${item.type}_attendee`;
            }
            const points = POINTS_CONFIG.conference[pointKey] || 2;
            breakdown.conferences += points;
            total += points;
        });
    }
    
    // Training points
    if (achievements.training) {
        achievements.training.forEach(item => {
            const points = item.certified 
                ? POINTS_CONFIG.training.certified 
                : POINTS_CONFIG.training.uncertified;
            breakdown.training += points;
            total += points;
        });
    }
    
    // Teaching points
    if (achievements.teaching) {
        achievements.teaching.forEach(item => {
            let points = POINTS_CONFIG.teaching.lectures;
            if (item.type === 'course_development' || item.type === 'curriculum') {
                points = POINTS_CONFIG.teaching.course_development;
            } else if (item.type === 'assessment') {
                points = POINTS_CONFIG.teaching.assessment;
            }
            breakdown.teaching += points;
            total += points;
        });
    }
    
    return { total, breakdown };
}

// Simulate points
app.post('/api/faculty/simulate', (req, res) => {
    const { additions } = req.body;
    
    // Clone current achievements
    const simulatedAchievements = JSON.parse(JSON.stringify(facultyData.achievements));
    
    // Add simulated items
    if (additions.research) {
        simulatedAchievements.research.push(...additions.research);
    }
    if (additions.patents) {
        simulatedAchievements.patents.push(...additions.patents);
    }
    if (additions.supervision) {
        simulatedAchievements.supervision.push(...additions.supervision);
    }
    if (additions.conferences) {
        simulatedAchievements.conferences.push(...additions.conferences);
    }
    if (additions.training) {
        simulatedAchievements.training.push(...additions.training);
    }
    if (additions.teaching) {
        simulatedAchievements.teaching.push(...additions.teaching);
    }
    
    const simulatedPoints = calculatePoints(simulatedAchievements);
    const requirements = PROMOTION_REQUIREMENTS[facultyData.profile.currentPosition];
    
    res.json({
        currentPoints: facultyData.points.total,
        simulatedPoints: simulatedPoints.total,
        pointsGained: simulatedPoints.total - facultyData.points.total,
        wouldBeEligible: simulatedPoints.total >= (requirements?.minPoints || 0),
        breakdown: simulatedPoints.breakdown
    });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║     Faculty Promotion Tracking System                      ║
║     Server running on http://localhost:${PORT}               ║
╚════════════════════════════════════════════════════════════╝
    `);
});
