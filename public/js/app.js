// ===================================
// PromoTrack - نظام الترقيات الأكاديمية
// Wizard + Dashboard JavaScript
// ===================================

const API_BASE = '/api';

// Points Configuration (mirrors server)
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

// Requirements
const REQUIREMENTS = {
    teaching_assistant: { min: 46, max: 70, next: 'محاضر' },
    lecturer: { min: 50, max: 80, next: 'أستاذ مساعد' },
    assistant_professor: { min: 60, max: 100, next: 'أستاذ مشارك' }
};

// State
let wizardData = {
    profile: { name: '', degree: '', currentPosition: '' },
    achievements: {
        research: [],
        patents: [],
        supervision: [],
        conferences: [],
        training: [],
        teaching: []
    },
    currentPoints: 0
};

let currentStep = 1;

// ===================================
// Initialization
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if wizard was completed
    const response = await fetch(`${API_BASE}/faculty`);
    const data = await response.json();

    if (data.wizardCompleted) {
        showDashboard(data);
    } else {
        initWizard();
    }

    initActivityTabs();
    initDashboardTabs();
    initNavigation();
});

// ===================================
// Wizard Functions
// ===================================

function initWizard() {
    document.getElementById('wizard-container').style.display = 'flex';
    document.getElementById('dashboard-container').style.display = 'none';
}

function updateWizardProgress() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');

        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
}

function nextStep(from) {
    // Validate current step
    if (!validateStep(from)) return;

    // Save data from current step
    saveStepData(from);

    // Move to next step
    currentStep = from + 1;

    // Update UI
    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${currentStep}`).classList.add('active');

    updateWizardProgress();

    // Special handling for step 3 and 4
    if (currentStep === 3) {
        updateRequiredPoints();
    } else if (currentStep === 4) {
        showResult();
    }
}

function prevStep(from) {
    currentStep = from - 1;

    document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
    document.getElementById(`step-${currentStep}`).classList.add('active');

    updateWizardProgress();
}

function validateStep(step) {
    switch (step) {
        case 1:
            const name = document.getElementById('wizard-name').value.trim();
            const degree = document.querySelector('input[name="wizard-degree"]:checked');

            if (!name) {
                showToast('يرجى إدخال الاسم', 'error');
                return false;
            }
            if (!degree) {
                showToast('يرجى اختيار الدرجة العلمية', 'error');
                return false;
            }
            return true;

        case 2:
            const position = document.querySelector('input[name="wizard-position"]:checked');
            if (!position) {
                showToast('يرجى اختيار المنصب الحالي', 'error');
                return false;
            }
            return true;

        case 3:
            return true; // Activities are optional

        default:
            return true;
    }
}

function saveStepData(step) {
    switch (step) {
        case 1:
            wizardData.profile.name = document.getElementById('wizard-name').value.trim();
            wizardData.profile.degree = document.querySelector('input[name="wizard-degree"]:checked').value;
            break;

        case 2:
            wizardData.profile.currentPosition = document.querySelector('input[name="wizard-position"]:checked').value;
            break;
    }
}

function updateRequiredPoints() {
    const position = wizardData.profile.currentPosition;
    const req = REQUIREMENTS[position];

    if (req) {
        document.getElementById('wizard-required').textContent = req.min;
        updateWizardPointsDisplay();
    }
}

// ===================================
// Activity Management (Wizard)
// ===================================

function initActivityTabs() {
    document.querySelectorAll('.activity-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const activity = tab.dataset.activity;

            document.querySelectorAll('.activity-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.activity-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`activity-${activity}`).classList.add('active');
        });
    });
}

function addWizardItem(type) {
    let item = {};
    let points = 0;

    switch (type) {
        case 'research':
            const title = document.getElementById('w-research-title').value.trim();
            const quartile = document.getElementById('w-research-quartile').value;

            if (!title) {
                showToast('يرجى إدخال عنوان البحث', 'error');
                return;
            }

            item = { id: Date.now(), title, quartile };
            points = POINTS_CONFIG.research[quartile];
            document.getElementById('w-research-title').value = '';
            break;

        case 'patents':
            const patentTitle = document.getElementById('w-patent-title').value.trim();
            const status = document.getElementById('w-patent-status').value;

            if (!patentTitle) {
                showToast('يرجى إدخال عنوان براءة الاختراع', 'error');
                return;
            }

            item = { id: Date.now(), title: patentTitle, status };
            points = POINTS_CONFIG.patent[status];
            document.getElementById('w-patent-title').value = '';
            break;

        case 'supervision':
            const supName = document.getElementById('w-supervision-name').value.trim();
            const supType = document.getElementById('w-supervision-type').value;

            if (!supName) {
                showToast('يرجى إدخال اسم الطالب/المشروع', 'error');
                return;
            }

            item = { id: Date.now(), name: supName, type: supType };
            points = POINTS_CONFIG.supervision[supType];
            document.getElementById('w-supervision-name').value = '';
            break;

        case 'conferences':
            const confName = document.getElementById('w-conference-name').value.trim();
            const confType = document.getElementById('w-conference-type').value;
            const confRole = document.getElementById('w-conference-role').value;

            if (!confName) {
                showToast('يرجى إدخال اسم المؤتمر', 'error');
                return;
            }

            item = { id: Date.now(), name: confName, type: confType, role: confRole };
            const confKey = `${confType}_${confRole}`;
            points = POINTS_CONFIG.conference[confKey] || 2;
            document.getElementById('w-conference-name').value = '';
            break;

        case 'training':
            const trainTitle = document.getElementById('w-training-title').value.trim();
            const certified = document.getElementById('w-training-certified').value === 'true';

            if (!trainTitle) {
                showToast('يرجى إدخال عنوان الدورة', 'error');
                return;
            }

            item = { id: Date.now(), title: trainTitle, certified };
            points = certified ? POINTS_CONFIG.training.certified : POINTS_CONFIG.training.uncertified;
            document.getElementById('w-training-title').value = '';
            break;

        case 'teaching':
            const teachTitle = document.getElementById('w-teaching-title').value.trim();
            const teachType = document.getElementById('w-teaching-type').value;

            if (!teachTitle) {
                showToast('يرجى إدخال عنوان النشاط', 'error');
                return;
            }

            item = { id: Date.now(), title: teachTitle, type: teachType };
            points = POINTS_CONFIG.teaching[teachType] || 3;
            document.getElementById('w-teaching-title').value = '';
            break;
    }

    item.points = points;
    wizardData.achievements[type].push(item);

    renderWizardList(type);
    updateWizardPointsDisplay();
    showToast(`تمت الإضافة (+${points} نقطة)`, 'success');
}

function removeWizardItem(type, id) {
    wizardData.achievements[type] = wizardData.achievements[type].filter(item => item.id !== id);
    renderWizardList(type);
    updateWizardPointsDisplay();
}

function renderWizardList(type) {
    const list = document.getElementById(`w-${type}-list`);
    const items = wizardData.achievements[type];

    if (items.length === 0) {
        list.innerHTML = '';
        return;
    }

    list.innerHTML = items.map(item => `
        <div class="activity-item">
            <div class="activity-item-info">
                <div class="activity-item-title">${item.title || item.name}</div>
                <div class="activity-item-meta">${getItemMeta(type, item)}</div>
            </div>
            <span class="activity-item-points">+${item.points}</span>
            <button class="activity-item-delete" onclick="removeWizardItem('${type}', ${item.id})">✕</button>
        </div>
    `).join('');
}

function getItemMeta(type, item) {
    switch (type) {
        case 'research': return item.quartile;
        case 'patents': return item.status === 'granted' ? 'ممنوحة' : 'قيد المراجعة';
        case 'supervision':
            const supTypes = { phd: 'دكتوراه', masters: 'ماجستير', graduation: 'تخرج' };
            return supTypes[item.type] || item.type;
        case 'conferences':
            const confTypes = { international: 'دولي', local: 'محلي' };
            const confRoles = { presenter: 'مقدّم', attendee: 'حاضر' };
            return `${confTypes[item.type] || item.type} - ${confRoles[item.role] || item.role}`;
        case 'training': return item.certified ? 'معتمدة' : 'غير معتمدة';
        case 'teaching':
            const teachTypes = { course_development: 'تطوير مقرر', lectures: 'محاضرات', assessment: 'تقييم' };
            return teachTypes[item.type] || item.type.replace('_', ' ');
        default: return '';
    }
}

function updateWizardPointsDisplay() {
    let total = 0;

    Object.values(wizardData.achievements).forEach(items => {
        items.forEach(item => {
            total += item.points || 0;
        });
    });

    wizardData.currentPoints = total;

    document.getElementById('wizard-points').textContent = total;

    const position = wizardData.profile.currentPosition;
    const req = REQUIREMENTS[position];

    if (req) {
        const percentage = Math.min(100, (total / req.min) * 100);
        document.getElementById('wizard-points-bar').style.width = `${percentage}%`;
    }
}

// ===================================
// Result Screen
// ===================================

async function showResult() {
    // Submit wizard data to server
    try {
        const response = await fetch(`${API_BASE}/faculty/wizard`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                profile: wizardData.profile,
                achievements: wizardData.achievements
            })
        });

        const data = await response.json();

        const resultCard = document.getElementById('result-card');
        const req = REQUIREMENTS[wizardData.profile.currentPosition];
        const points = wizardData.currentPoints;
        const isEligible = points >= req.min;

        if (isEligible) {
            resultCard.innerHTML = `
                <div class="result-icon">🎉</div>
                <h2 class="result-title success">تهانينا!</h2>
                <p class="result-message">أنت مؤهل للترقية إلى ${req.next}</p>
                <div class="result-points">
                    <div class="result-stat">
                        <div class="result-stat-value current">${points}</div>
                        <div class="result-stat-label">نقاطك</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value required">${req.min}</div>
                        <div class="result-stat-label">المطلوب</div>
                    </div>
                </div>
            `;
            document.getElementById('result-action-btn').textContent = '← الذهاب للوحة التحكم';
        } else {
            const needed = req.min - points;
            resultCard.innerHTML = `
                <div class="result-icon">📋</div>
                <h2 class="result-title error">غير مؤهل بعد</h2>
                <p class="result-message">تحتاج إلى المزيد من النقاط للتقديم على الترقية</p>
                <div class="result-points">
                    <div class="result-stat">
                        <div class="result-stat-value current">${points}</div>
                        <div class="result-stat-label">نقاطك</div>
                    </div>
                    <div class="result-stat">
                        <div class="result-stat-value required">${req.min}</div>
                        <div class="result-stat-label">المطلوب</div>
                    </div>
                </div>
                <div class="result-needed">
                    <h4>⚠️ تحتاج ${needed} نقطة إضافية</h4>
                    <p>انتقل إلى لوحة التحكم لإضافة المزيد من الإنجازات ومتابعة تقدمك.</p>
                </div>
            `;
            document.getElementById('result-action-btn').textContent = '← الذهاب للوحة التحكم';
        }

    } catch (error) {
        console.error('Error submitting wizard data:', error);
        showToast('خطأ في حفظ البيانات', 'error');
    }
}

function goToDashboard() {
    document.getElementById('wizard-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';
    loadDashboardData();
}

// ===================================
// Dashboard Functions
// ===================================

function showDashboard(data) {
    document.getElementById('wizard-container').style.display = 'none';
    document.getElementById('dashboard-container').style.display = 'block';

    // Restore wizard data from server
    wizardData.profile = data.profile;
    wizardData.achievements = data.achievements;
    wizardData.currentPoints = data.points.total;

    updateDashboardUI(data);
}

async function loadDashboardData() {
    try {
        const response = await fetch(`${API_BASE}/faculty`);
        const data = await response.json();
        updateDashboardUI(data);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateDashboardUI(data) {
    const { profile, points, promotionStatus } = data;
    const req = REQUIREMENTS[profile.currentPosition];

    // Update header info
    document.getElementById('dash-name').textContent = profile.name || 'عضو هيئة التدريس';

    // Update status cards
    document.getElementById('dash-points').textContent = points.total;
    document.getElementById('dash-required').textContent = req?.min || 0;
    document.getElementById('dash-needed').textContent = Math.max(0, (req?.min || 0) - points.total);

    const eligCard = document.getElementById('eligibility-card');
    const statusEl = document.getElementById('dash-status');

    if (points.total >= (req?.min || 0)) {
        eligCard.className = 'status-card glass-card eligible';
        statusEl.textContent = 'مؤهل ✓';
        document.querySelector('.eligible-icon').textContent = '✅';
    } else {
        eligCard.className = 'status-card glass-card not-eligible';
        statusEl.textContent = 'غير مؤهل';
        document.querySelector('.eligible-icon').textContent = '❌';
    }

    // Update progress bar
    const percentage = Math.min(100, (points.total / (req?.max || 70)) * 100);
    document.getElementById('dash-progress-bar').style.width = `${percentage}%`;
    document.getElementById('progress-percent').textContent = `${Math.round(percentage)}%`;
    document.getElementById('progress-min-label').textContent = `${req?.min || 46} (أدنى)`;
    document.getElementById('progress-max-label').textContent = `${req?.max || 70} (أقصى)`;

    // Update position info
    const positionNames = {
        teaching_assistant: 'معيد',
        lecturer: 'محاضر',
        assistant_professor: 'أستاذ مساعد'
    };
    document.getElementById('dash-position').textContent = positionNames[profile.currentPosition] || profile.currentPosition;
    document.getElementById('dash-next-position').textContent = req?.next || 'المنصب التالي';

    // Update breakdown
    updateBreakdown(points.breakdown);

    // Update achievements lists
    renderDashboardLists(data.achievements);

    // Update simulator
    document.getElementById('sim-current-pts').textContent = points.total;
    document.getElementById('sim-projected-pts').textContent = points.total;

    // Update apply section
    updateApplySection(points.total, req);
}

function updateBreakdown(breakdown) {
    const grid = document.getElementById('breakdown-grid');
    const icons = {
        research: '📄',
        patents: '💎',
        supervision: '👥',
        conferences: '🎤',
        training: '🎓',
        teaching: '📚'
    };

    const categoryNames = {
        research: 'الأبحاث',
        patents: 'براءات الاختراع',
        supervision: 'الإشراف',
        conferences: 'المؤتمرات',
        training: 'التدريب',
        teaching: 'التدريس'
    };

    grid.innerHTML = Object.entries(breakdown).map(([key, value]) => `
        <div class="breakdown-item">
            <span class="breakdown-label">
                <span>${icons[key] || '📋'}</span>
                ${categoryNames[key] || key}
            </span>
            <span class="breakdown-value">${value} نقطة</span>
        </div>
    `).join('');
}

// ===================================
// Dashboard Tabs
// ===================================

function initDashboardTabs() {
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(`tab-${tabId}`).classList.add('active');
        });
    });
}

function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;

            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(section).classList.add('active');

            if (section === 'simulator') {
                runSimulator();
            }
        });
    });
}

// ===================================
// Dashboard Achievement Management
// ===================================

async function addDashboardItem(type) {
    let item = {};

    switch (type) {
        case 'research':
            const title = document.getElementById('d-research-title').value.trim();
            const journal = document.getElementById('d-research-journal').value.trim();
            const quartile = document.getElementById('d-research-quartile').value;

            if (!title) {
                showToast('يرجى إدخال عنوان البحث', 'error');
                return;
            }

            item = { title, journal, quartile };
            document.getElementById('d-research-title').value = '';
            document.getElementById('d-research-journal').value = '';
            break;

        case 'patents':
            const patentTitle = document.getElementById('d-patent-title').value.trim();
            const patentNumber = document.getElementById('d-patent-number').value.trim();
            const status = document.getElementById('d-patent-status').value;

            if (!patentTitle) {
                showToast('يرجى إدخال عنوان براءة الاختراع', 'error');
                return;
            }

            item = { title: patentTitle, number: patentNumber, status };
            document.getElementById('d-patent-title').value = '';
            document.getElementById('d-patent-number').value = '';
            break;

        case 'supervision':
            const student = document.getElementById('d-supervision-student').value.trim();
            const project = document.getElementById('d-supervision-project').value.trim();
            const supType = document.getElementById('d-supervision-type').value;

            if (!student) {
                showToast('يرجى إدخال اسم الطالب', 'error');
                return;
            }

            item = { studentName: student, projectTitle: project, type: supType };
            document.getElementById('d-supervision-student').value = '';
            document.getElementById('d-supervision-project').value = '';
            break;

        case 'conferences':
            const confName = document.getElementById('d-conference-name').value.trim();
            const confType = document.getElementById('d-conference-type').value;
            const confRole = document.getElementById('d-conference-role').value;

            if (!confName) {
                showToast('يرجى إدخال اسم المؤتمر', 'error');
                return;
            }

            item = { title: confName, type: confType, role: confRole };
            document.getElementById('d-conference-name').value = '';
            break;

        case 'training':
            const trainTitle = document.getElementById('d-training-title').value.trim();
            const provider = document.getElementById('d-training-provider').value.trim();
            const certified = document.getElementById('d-training-certified').checked;

            if (!trainTitle) {
                showToast('يرجى إدخال عنوان الدورة', 'error');
                return;
            }

            item = { title: trainTitle, provider, certified };
            document.getElementById('d-training-title').value = '';
            document.getElementById('d-training-provider').value = '';
            document.getElementById('d-training-certified').checked = false;
            break;

        case 'teaching':
            const teachTitle = document.getElementById('d-teaching-title').value.trim();
            const teachType = document.getElementById('d-teaching-type').value;

            if (!teachTitle) {
                showToast('يرجى إدخال عنوان النشاط', 'error');
                return;
            }

            item = { title: teachTitle, type: teachType };
            document.getElementById('d-teaching-title').value = '';
            break;
    }

    try {
        const response = await fetch(`${API_BASE}/faculty/achievements/${type}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });

        const data = await response.json();

        if (data.success) {
            showToast('تمت إضافة الإنجاز!', 'success');
            loadDashboardData();
        }
    } catch (error) {
        showToast('خطأ في إضافة الإنجاز', 'error');
    }
}

async function deleteDashboardItem(type, id) {
    try {
        const response = await fetch(`${API_BASE}/faculty/achievements/${type}/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showToast('تم حذف الإنجاز', 'success');
            loadDashboardData();
        }
    } catch (error) {
        showToast('خطأ في حذف الإنجاز', 'error');
    }
}

function renderDashboardLists(achievements) {
    const emptyMessages = {
        research: 'لم تتم إضافة أبحاث بعد',
        patents: 'لم تتم إضافة براءات اختراع بعد',
        supervision: 'لم تتم إضافة إشرافات بعد',
        conferences: 'لم تتم إضافة مؤتمرات بعد',
        training: 'لم تتم إضافة دورات تدريبية بعد',
        teaching: 'لم تتم إضافة أنشطة تدريسية بعد'
    };

    // Research
    renderDashboardList('research', achievements.research, item => `
        <div class="item-card">
            <span class="item-icon">📄</span>
            <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-meta">
                    <span>${item.journal || 'غير محدد'}</span>
                    <span>${item.quartile}</span>
                </div>
            </div>
            <span class="item-points">+${POINTS_CONFIG.research[item.quartile]} نقطة</span>
            <button class="item-delete" onclick="deleteDashboardItem('research', ${item.id})">✕</button>
        </div>
    `, emptyMessages.research);

    // Patents
    renderDashboardList('patents', achievements.patents, item => `
        <div class="item-card">
            <span class="item-icon">💎</span>
            <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-meta">
                    <span>${item.number || 'غير محدد'}</span>
                    <span>${item.status === 'granted' ? 'ممنوحة' : 'قيد المراجعة'}</span>
                </div>
            </div>
            <span class="item-points">+${POINTS_CONFIG.patent[item.status]} نقطة</span>
            <button class="item-delete" onclick="deleteDashboardItem('patents', ${item.id})">✕</button>
        </div>
    `, emptyMessages.patents);

    // Supervision
    renderDashboardList('supervision', achievements.supervision, item => {
        const supTypes = { phd: 'دكتوراه', masters: 'ماجستير', graduation: 'تخرج' };
        return `
        <div class="item-card">
            <span class="item-icon">👥</span>
            <div class="item-content">
                <div class="item-title">${item.projectTitle || item.name}</div>
                <div class="item-meta">
                    <span>${item.studentName || ''}</span>
                    <span>${supTypes[item.type] || item.type}</span>
                </div>
            </div>
            <span class="item-points">+${POINTS_CONFIG.supervision[item.type]} نقطة</span>
            <button class="item-delete" onclick="deleteDashboardItem('supervision', ${item.id})">✕</button>
        </div>
    `}, emptyMessages.supervision);

    // Conferences
    renderDashboardList('conferences', achievements.conferences, item => {
        const key = `${item.type}_${item.role === 'presenter' || item.role === 'keynote' || item.role === 'organizer' ? 'presenter' : 'attendee'}`;
        const confTypes = { international: 'دولي', local: 'محلي' };
        const confRoles = { presenter: 'مقدّم', attendee: 'حاضر', keynote: 'متحدث رئيسي', organizer: 'منظم' };
        return `
        <div class="item-card">
            <span class="item-icon">🎤</span>
            <div class="item-content">
                <div class="item-title">${item.title || item.name}</div>
                <div class="item-meta">
                    <span>${confTypes[item.type] || item.type}</span>
                    <span>${confRoles[item.role] || item.role}</span>
                </div>
            </div>
            <span class="item-points">+${POINTS_CONFIG.conference[key] || 2} نقطة</span>
            <button class="item-delete" onclick="deleteDashboardItem('conferences', ${item.id})">✕</button>
        </div>
    `}, emptyMessages.conferences);

    // Training
    renderDashboardList('training', achievements.training, item => `
        <div class="item-card">
            <span class="item-icon">🎓</span>
            <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-meta">
                    <span>${item.provider || 'غير محدد'}</span>
                    <span>${item.certified ? 'معتمدة' : 'غير معتمدة'}</span>
                </div>
            </div>
            <span class="item-points">+${item.certified ? POINTS_CONFIG.training.certified : POINTS_CONFIG.training.uncertified} نقطة</span>
            <button class="item-delete" onclick="deleteDashboardItem('training', ${item.id})">✕</button>
        </div>
    `, emptyMessages.training);

    // Teaching
    renderDashboardList('teaching', achievements.teaching, item => {
        const teachTypes = { course_development: 'تطوير مقرر', lectures: 'محاضرات', assessment: 'تقييم' };
        return `
        <div class="item-card">
            <span class="item-icon">📚</span>
            <div class="item-content">
                <div class="item-title">${item.title}</div>
                <div class="item-meta">
                    <span>${teachTypes[item.type] || item.type?.replace('_', ' ') || 'غير محدد'}</span>
                </div>
            </div>
            <span class="item-points">+${POINTS_CONFIG.teaching[item.type] || 3} نقطة</span>
            <button class="item-delete" onclick="deleteDashboardItem('teaching', ${item.id})">✕</button>
        </div>
    `}, emptyMessages.teaching);
}

function renderDashboardList(type, items, template, emptyMessage) {
    const list = document.getElementById(`d-${type}-list`);

    if (!items || items.length === 0) {
        list.innerHTML = `<p class="empty-state">${emptyMessage || 'لا توجد عناصر بعد'}</p>`;
        return;
    }

    list.innerHTML = items.map(template).join('');
}

// ===================================
// Simulator
// ===================================

async function runSimulator() {
    const additions = {
        research: [],
        patents: [],
        supervision: [],
        conferences: [],
        training: [],
        teaching: []
    };

    let additionalPoints = 0;

    if (document.getElementById('sim-q1')?.checked) {
        additions.research.push({ quartile: 'Q1' });
        additionalPoints += 15;
    }
    if (document.getElementById('sim-q2')?.checked) {
        additions.research.push({ quartile: 'Q2' });
        additionalPoints += 12;
    }
    if (document.getElementById('sim-patent')?.checked) {
        additions.patents.push({ status: 'granted' });
        additionalPoints += 20;
    }
    if (document.getElementById('sim-phd')?.checked) {
        additions.supervision.push({ type: 'phd' });
        additionalPoints += 15;
    }
    if (document.getElementById('sim-masters')?.checked) {
        additions.supervision.push({ type: 'masters' });
        additionalPoints += 10;
    }
    if (document.getElementById('sim-intl-conf')?.checked) {
        additions.conferences.push({ type: 'international', role: 'presenter' });
        additionalPoints += 8;
    }
    if (document.getElementById('sim-training')?.checked) {
        additions.training.push({ certified: true });
        additionalPoints += 5;
    }

    // Get current points from display
    const currentPts = parseInt(document.getElementById('dash-points')?.textContent) || wizardData.currentPoints;
    const projectedPts = currentPts + additionalPoints;

    document.getElementById('sim-current-pts').textContent = currentPts;
    document.getElementById('sim-projected-pts').textContent = projectedPts;
    document.getElementById('sim-gain').textContent = `+${additionalPoints}`;

    // Check eligibility
    const position = wizardData.profile.currentPosition;
    const req = REQUIREMENTS[position];
    const eligEl = document.getElementById('sim-eligibility');

    if (projectedPts >= (req?.min || 46)) {
        eligEl.className = 'sim-eligibility eligible';
        eligEl.innerHTML = `✅ ستكون <strong>مؤهلاً</strong> للترقية!`;
    } else {
        const needed = (req?.min || 46) - projectedPts;
        eligEl.className = 'sim-eligibility not-eligible';
        eligEl.innerHTML = `❌ لا تزال بحاجة إلى <strong>${needed} نقطة إضافية</strong>`;
    }
}

// ===================================
// Apply Section
// ===================================

function updateApplySection(currentPoints, req) {
    const applyCard = document.getElementById('apply-card');
    const isEligible = currentPoints >= (req?.min || 46);

    if (isEligible) {
        applyCard.innerHTML = `
            <div class="apply-icon">🎉</div>
            <h2>أنت مؤهل!</h2>
            <p>تهانينا! لقد استوفيت جميع المتطلبات ويمكنك التقديم للترقية إلى ${req?.next || 'المستوى التالي'}.</p>
            <div class="apply-checklist">
                <div class="checklist-item complete">
                    <span class="checklist-icon">✓</span>
                    <span>الحد الأدنى من النقاط المطلوبة (${req?.min || 46}+)</span>
                </div>
                <div class="checklist-item complete">
                    <span class="checklist-icon">✓</span>
                    <span>النقاط الحالية: ${currentPoints}</span>
                </div>
            </div>
            <button class="btn-apply" onclick="submitApplication()">تقديم طلب الترقية</button>
        `;
    } else {
        const needed = (req?.min || 46) - currentPoints;
        applyCard.innerHTML = `
            <div class="apply-icon">📋</div>
            <h2>غير مؤهل بعد</h2>
            <p>تحتاج ${needed} نقطة إضافية للتقديم على الترقية.</p>
            <div class="apply-checklist">
                <div class="checklist-item incomplete">
                    <span class="checklist-icon">✕</span>
                    <span>الحد الأدنى من النقاط: ${req?.min || 46} مطلوب</span>
                </div>
                <div class="checklist-item incomplete">
                    <span class="checklist-icon">✕</span>
                    <span>النقاط الحالية: ${currentPoints}</span>
                </div>
            </div>
            <button class="btn-apply" disabled>لا يمكن التقديم حالياً</button>
        `;
    }
}

async function submitApplication() {
    try {
        const response = await fetch(`${API_BASE}/faculty/apply`, {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            showToast('تم تقديم الطلب بنجاح!', 'success');

            document.getElementById('apply-card').innerHTML = `
                <div class="apply-icon">✅</div>
                <h2>تم تقديم الطلب!</h2>
                <p>تم تقديم طلب الترقية الخاص بك وهو قيد المراجعة.</p>
                <p style="margin-top: 1rem; color: var(--text-muted);">
                    تاريخ التقديم: ${new Date().toLocaleDateString('ar-EG')}
                </p>
            `;
        }
    } catch (error) {
        showToast('خطأ في تقديم الطلب', 'error');
    }
}

// ===================================
// Reset
// ===================================

async function resetAll() {
    if (!confirm('هل أنت متأكد من البدء من جديد؟ سيتم فقدان جميع البيانات.')) {
        return;
    }

    try {
        await fetch(`${API_BASE}/faculty/reset`, { method: 'POST' });

        // Reset wizard data
        wizardData = {
            profile: { name: '', degree: '', currentPosition: '' },
            achievements: {
                research: [],
                patents: [],
                supervision: [],
                conferences: [],
                training: [],
                teaching: []
            },
            currentPoints: 0
        };
        currentStep = 1;

        // Show wizard
        document.getElementById('dashboard-container').style.display = 'none';
        document.getElementById('wizard-container').style.display = 'flex';

        // Reset wizard UI
        document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
        document.getElementById('step-1').classList.add('active');
        updateWizardProgress();

        // Clear inputs
        document.getElementById('wizard-name').value = '';
        document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);

        showToast('تم إعادة تعيين البيانات بنجاح', 'success');
    } catch (error) {
        showToast('خطأ في إعادة تعيين البيانات', 'error');
    }
}

// ===================================
// Utilities
// ===================================

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Global functions
window.nextStep = nextStep;
window.prevStep = prevStep;
window.addWizardItem = addWizardItem;
window.removeWizardItem = removeWizardItem;
window.goToDashboard = goToDashboard;
window.addDashboardItem = addDashboardItem;
window.deleteDashboardItem = deleteDashboardItem;
window.runSimulator = runSimulator;
window.submitApplication = submitApplication;
window.resetAll = resetAll;
