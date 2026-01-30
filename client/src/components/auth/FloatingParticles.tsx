import { useMemo } from 'react';

interface Particle {
    id: number;
    size: number;
    left: number;
    delay: number;
    duration: number;
    opacity: number;
}

export default function FloatingParticles() {
    // Generate minimal, elegant particles
    const particles = useMemo<Particle[]>(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            id: i,
            size: Math.random() * 40 + 15, // 15-55px (smaller)
            left: Math.random() * 100, // 0-100%
            delay: Math.random() * 15, // 0-15s delay
            duration: Math.random() * 25 + 30, // 30-55s (slower)
            opacity: Math.random() * 0.12 + 0.05, // 0.05-0.17 (more subtle)
        }));
    }, []);

    return (
        <div className="particles-container" aria-hidden="true">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="particle"
                    style={{
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        left: `${particle.left}%`,
                        opacity: particle.opacity,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}
