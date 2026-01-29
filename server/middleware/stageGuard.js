const db = require('../db');

const stageGuard = (requiredStage) => {
    return async (req, res, next) => {
        const userId = req.userId || req.body.userId || req.query.userId || req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: "StageGuard: userId missing in request" });
        }

        try {
            const result = await db.query('SELECT current_stage FROM user_progress WHERE user_id = $1', [userId]);
            const progress = result.rows[0];

            if (!progress) {
                return res.status(403).json({ error: "Access Denied: Progression not started." });
            }

            if (progress.current_stage < requiredStage) {
                return res.status(403).json({
                    error: `Access Denied. You are at Stage ${progress.current_stage}, but Stage ${requiredStage} is required.`
                });
            }

            next();
        } catch (err) {
            console.error("StageGuard Error:", err);
            res.status(500).json({ error: "Internal Server Error during stage verification" });
        }
    };
};

module.exports = stageGuard;
