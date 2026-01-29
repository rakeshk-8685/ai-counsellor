function calculateProfileStrength(profile) {
    let score = 0;
    let missing = [];

    // 1. Academics
    if (profile.academic_data?.gpa) {
        const gpa = parseFloat(profile.academic_data.gpa);
        if (gpa >= 3.5) score += 40;
        else if (gpa >= 3.0) score += 30;
        else score += 20;
    } else {
        missing.push("GPA");
    }

    // 2. Exams
    if (profile.exams?.ieltsScore || profile.exams?.toeflScore) score += 30;
    else missing.push("English Test");

    if (profile.exams?.greScore || profile.exams?.gmatScore) score += 20;

    // 3. SOP
    if (profile.exams?.sopStatus === 'Ready') score += 10;
    else if (profile.exams?.sopStatus === 'Draft') score += 5;

    let label = "Weak";
    if (score > 80) label = "Strong";
    else if (score > 50) label = "Average";

    return { score, label, missing };
}

module.exports = { calculateProfileStrength };
