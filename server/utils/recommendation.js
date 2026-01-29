const calculateMatch = (profile, university) => {
    let score = 50; // Base score
    let reasoning = [];
    let label = "Target";

    // 1. GPA Match
    const userGPA = parseFloat(profile.academic_data?.gpa || 3.0);
    // Rough logic: Ivy Leagues need 3.8+, Publics 3.0+
    let requiredGPA = 3.0;
    if (university.ranking < 20) requiredGPA = 3.8;
    else if (university.ranking < 100) requiredGPA = 3.4;

    if (userGPA >= requiredGPA) {
        score += 20;
        reasoning.push("Your GPA meets the requirements.");
    } else if (userGPA >= requiredGPA - 0.2) {
        score -= 10;
        reasoning.push("GPA is slightly below average admits.");
    } else {
        score -= 30;
        reasoning.push("GPA is significantly below average.");
    }

    // 2. Acceptance Rate Risk
    if (university.acceptance_rate < 10) {
        score -= 10; // Always competitive
        reasoning.push("Highly competitive acceptance rate.");
    } else if (university.acceptance_rate > 50) {
        score += 10;
        reasoning.push("Good acceptance chance.");
    }

    // 3. Program Fit (Simple String Match)
    const userMajor = profile.academic_data?.major || "";
    // Check if university programs include something similar
    // This is a prototype check. Real system would use vectors.
    // For now, we assume if we recommend it, it has the program or we don't penalize.

    // Final Labeling
    if (score >= 70 && university.acceptance_rate > 30) label = "Safe";
    else if (score >= 50) label = "Target";
    else label = "Dream";

    // Override: Top 10 are always Dream/Target unless profile is perfect
    if (university.ranking <= 10 && score < 90) label = "Dream";

    return { score, label, fit: reasoning.join(' ') };
};

const estimateCost = (budgetProfile, university) => {
    const tuition = university.tuition_fee || 30000;
    const living = university.living_cost || 15000;
    const total = tuition + living;

    // User Budget
    const userMax = parseInt(budgetProfile?.budgetRange?.split('-')[1] || "50000"); // e.g. "30000-50000"

    const affordable = total <= userMax;

    return {
        total: `$${(total / 1000).toFixed(1)}k/yr`,
        tuition: `$${(tuition / 1000).toFixed(1)}k`,
        living: `$${(living / 1000).toFixed(1)}k`,
        affordable,
        message: affordable ? "Within Budget" : "Exceeds Budget"
    };
};

module.exports = { calculateMatch, estimateCost };
