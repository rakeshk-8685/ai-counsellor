/**
 * Dashboard Service - Centralized AI-driven dashboard logic
 * 
 * Provides:
 * - Granular profile strength calculation (Academics, Exams, SOP)
 * - Rule-based stage recalculation
 * - Stage blocking reason generation
 */

/**
 * Calculate granular profile strength with individual category ratings
 * @param {Object} profile - User profile from database
 * @param {Array} completedTasks - List of completed task IDs
 * @returns {Object} Detailed strength breakdown
 */
function calculateGranularStrength(profile, completedTasks = []) {
    const result = {
        overall: { score: 0, label: 'Weak' },
        academics: { status: 'Weak', score: 0, details: '' },
        exams: { status: 'Not Started', score: 0, details: '' },
        sop: { status: 'Not Started', score: 0, details: '' },
        missing: [],
        recommendations: []
    };

    // 1. ACADEMICS (40 points max)
    const academicData = profile.academic_data || {};
    if (academicData.gpa) {
        const gpa = parseFloat(academicData.gpa);
        if (gpa >= 3.7) {
            result.academics = { status: 'Strong', score: 40, details: `GPA ${gpa} is excellent` };
        } else if (gpa >= 3.3) {
            result.academics = { status: 'Strong', score: 35, details: `GPA ${gpa} is competitive` };
        } else if (gpa >= 3.0) {
            result.academics = { status: 'Average', score: 25, details: `GPA ${gpa} meets minimum requirements` };
        } else {
            result.academics = { status: 'Weak', score: 15, details: `GPA ${gpa} may limit options` };
            result.recommendations.push('Consider programs with holistic admissions');
        }
    } else {
        result.missing.push('GPA');
        result.academics = { status: 'Weak', score: 0, details: 'GPA not provided' };
    }

    // 2. EXAMS (35 points max)
    const exams = profile.exams || {};
    let examScore = 0;
    let examStatus = 'Not Started';
    let examDetails = [];

    // English proficiency (20 points)
    if (exams.ieltsScore) {
        const ielts = parseFloat(exams.ieltsScore);
        if (ielts >= 7.5) {
            examScore += 20;
            examDetails.push(`IELTS ${ielts} (Excellent)`);
        } else if (ielts >= 6.5) {
            examScore += 15;
            examDetails.push(`IELTS ${ielts} (Good)`);
        } else {
            examScore += 10;
            examDetails.push(`IELTS ${ielts} (Minimum)`);
            result.recommendations.push('Consider retaking IELTS for better score');
        }
        examStatus = 'Completed';
    } else if (exams.toeflScore) {
        const toefl = parseInt(exams.toeflScore);
        if (toefl >= 100) {
            examScore += 20;
            examDetails.push(`TOEFL ${toefl} (Excellent)`);
        } else if (toefl >= 90) {
            examScore += 15;
            examDetails.push(`TOEFL ${toefl} (Good)`);
        } else {
            examScore += 10;
            examDetails.push(`TOEFL ${toefl} (Minimum)`);
        }
        examStatus = 'Completed';
    } else {
        result.missing.push('English Test (IELTS/TOEFL)');
        examDetails.push('English proficiency test pending');
    }

    // GRE/GMAT (15 points)
    if (exams.greScore) {
        const gre = parseInt(exams.greScore);
        if (gre >= 320) {
            examScore += 15;
            examDetails.push(`GRE ${gre} (Excellent)`);
        } else if (gre >= 310) {
            examScore += 12;
            examDetails.push(`GRE ${gre} (Good)`);
        } else {
            examScore += 8;
            examDetails.push(`GRE ${gre} (Average)`);
        }
        examStatus = 'Completed';
    } else if (exams.gmatScore) {
        examScore += Math.min(15, Math.floor(exams.gmatScore / 50));
        examDetails.push(`GMAT ${exams.gmatScore}`);
        examStatus = 'Completed';
    }

    // Determine exam status
    if (examScore === 0) {
        examStatus = 'Not Started';
    } else if (examScore < 20) {
        examStatus = 'In Progress';
    } else {
        examStatus = 'Completed';
    }

    result.exams = {
        status: examStatus,
        score: examScore,
        details: examDetails.length > 0 ? examDetails.join(', ') : 'No exams recorded'
    };

    // 3. SOP (25 points max)
    const sopStatus = exams.sopStatus || 'Not Started';
    if (sopStatus === 'Ready') {
        result.sop = { status: 'Ready', score: 25, details: 'SOP completed and polished' };
    } else if (sopStatus === 'Draft') {
        result.sop = { status: 'Draft', score: 15, details: 'SOP in progress - needs refinement' };
        result.recommendations.push('Finalize your Statement of Purpose');
    } else {
        result.sop = { status: 'Not Started', score: 0, details: 'SOP not started yet' };
        result.missing.push('Statement of Purpose (SOP)');
        result.recommendations.push('Start drafting your Statement of Purpose');
    }

    // Overall calculation
    const totalScore = result.academics.score + result.exams.score + result.sop.score;
    result.overall.score = totalScore;

    if (totalScore >= 80) {
        result.overall.label = 'Strong';
    } else if (totalScore >= 50) {
        result.overall.label = 'Average';
    } else {
        result.overall.label = 'Weak';
    }

    return result;
}

/**
 * Recalculate user's current stage based on progress and tasks
 * @param {Object} progress - User progress record
 * @param {Object} profile - User profile
 * @param {Array} lockedUnis - Locked universities
 * @param {Array} completedTasks - Completed task IDs
 * @returns {Object} Stage info with blocking status
 */
function recalculateStage(progress, profile, lockedUnis = [], completedTasks = []) {
    const stages = [
        { id: 1, name: 'Building Profile', progress: 25, description: 'Complete your academic profile' },
        { id: 2, name: 'Discovering Universities', progress: 50, description: 'Explore and shortlist universities' },
        { id: 3, name: 'Finalizing Universities', progress: 75, description: 'Lock your target university' },
        { id: 4, name: 'Preparing Applications', progress: 100, description: 'Complete application requirements' }
    ];

    let currentStageId = 1;
    const blockingReasons = [];

    // Stage 1 → 2: Profile must be complete
    if (progress.onboarding_completed && profile.status === 'complete') {
        currentStageId = 2;
    } else {
        blockingReasons.push({ stage: 2, reason: 'Complete your profile in the Onboarding flow' });
    }

    // Stage 2 → 3: Must complete counsellor session
    if (currentStageId >= 2 && progress.counsellor_completed) {
        currentStageId = 3;
    } else if (currentStageId >= 2) {
        blockingReasons.push({ stage: 3, reason: 'Complete a session with the AI Counsellor' });
    }

    // Stage 3 → 4: Must lock a university
    if (currentStageId >= 3 && lockedUnis.length > 0) {
        currentStageId = 4;
    } else if (currentStageId >= 3) {
        blockingReasons.push({ stage: 4, reason: 'Lock a university from your shortlist' });
    }

    const currentStage = stages.find(s => s.id === currentStageId) || stages[0];

    // Calculate progress within current stage
    let stageProgress = currentStage.progress;
    if (currentStageId === 1) {
        // Progress based on profile completeness
        let fields = 0;
        if (profile.academic_data?.gpa) fields++;
        if (profile.study_goals?.targetDegree) fields++;
        if (profile.budget?.budgetRange) fields++;
        if (profile.exams?.ieltsScore || profile.exams?.toeflScore) fields++;
        stageProgress = Math.min(25, fields * 6);
    }

    return {
        current: currentStage,
        all: stages.map(s => ({
            ...s,
            isActive: s.id === currentStageId,
            isPassed: s.id < currentStageId,
            isLocked: s.id > currentStageId,
            blockingReason: blockingReasons.find(b => b.stage === s.id)?.reason || null
        })),
        progress: stageProgress,
        blockingReasons
    };
}

/**
 * Generate stage-aware tasks
 * @param {Object} profile - User profile
 * @param {Object} stageInfo - Current stage info
 * @param {Object} strength - Profile strength
 * @param {Array} lockedUnis - Locked universities
 * @param {Array} existingTasks - Existing task records from DB
 * @returns {Array} Task list with completion status
 */
function generateStageTasks(profile, stageInfo, strength, lockedUnis = [], existingTasks = []) {
    const tasks = [];
    const stage = stageInfo.current;

    // Find existing task by ID
    const getExistingTask = (id) => existingTasks.find(t => t.task_id === id || t.id === id);

    // Stage 1: Building Profile
    if (stage.id === 1) {
        const t1 = getExistingTask('profile-complete');
        tasks.push({
            id: 'profile-complete',
            title: 'Complete Onboarding Profile',
            done: t1?.done || profile.status === 'complete',
            critical: true,
            type: 'profile'
        });

        if (strength.exams.status === 'Not Started') {
            const t2 = getExistingTask('book-english-test');
            tasks.push({
                id: 'book-english-test',
                title: 'Book IELTS or TOEFL Exam',
                done: t2?.done || false,
                critical: true,
                type: 'exam'
            });
        }
    }

    // Stage 2: Discovering Universities
    if (stage.id === 2) {
        const t3 = getExistingTask('shortlist-5');
        tasks.push({
            id: 'shortlist-5',
            title: 'Shortlist at least 5 Universities',
            done: t3?.done || false,
            critical: false,
            type: 'discovery'
        });

        const t4 = getExistingTask('counsellor-session');
        tasks.push({
            id: 'counsellor-session',
            title: 'Complete AI Counsellor Session',
            done: t4?.done || false,
            critical: true,
            type: 'counsellor'
        });
    }

    // Stage 3: Finalizing Universities
    if (stage.id === 3) {
        const t5 = getExistingTask('lock-university');
        tasks.push({
            id: 'lock-university',
            title: 'Lock Your Target University',
            done: t5?.done || lockedUnis.length > 0,
            critical: true,
            type: 'finalize'
        });
    }

    // Stage 4: Preparing Applications
    if (stage.id === 4 && lockedUnis.length > 0) {
        lockedUnis.forEach(uni => {
            const uniName = uni.university_name || 'University';

            const sopTask = getExistingTask(`sop-${uni.id}`);
            tasks.push({
                id: `sop-${uni.id}`,
                title: `Draft SOP for ${uniName}`,
                done: sopTask?.done || false,
                critical: true,
                type: 'sop'
            });

            const lorTask = getExistingTask(`lor-${uni.id}`);
            tasks.push({
                id: `lor-${uni.id}`,
                title: `Request Letters of Recommendation`,
                done: lorTask?.done || false,
                critical: true,
                type: 'lor'
            });

            const appTask = getExistingTask(`app-${uni.id}`);
            tasks.push({
                id: `app-${uni.id}`,
                title: `Submit Application to ${uniName}`,
                done: appTask?.done || false,
                critical: true,
                type: 'application'
            });
        });

        const visaTask = getExistingTask('visa-check');
        tasks.push({
            id: 'visa-check',
            title: 'Check Visa Requirements',
            done: visaTask?.done || false,
            critical: false,
            type: 'visa'
        });
    }

    // Add missing items from strength analysis as tasks
    strength.missing.forEach((item, idx) => {
        const itemId = `missing-${item.toLowerCase().replace(/\s+/g, '-')}`;
        const existingMissing = getExistingTask(itemId);
        if (!tasks.find(t => t.id === itemId)) {
            tasks.push({
                id: itemId,
                title: `Complete: ${item}`,
                done: existingMissing?.done || false,
                critical: true,
                type: 'missing'
            });
        }
    });

    return tasks;
}

module.exports = {
    calculateGranularStrength,
    recalculateStage,
    generateStageTasks
};
