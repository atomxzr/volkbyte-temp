// Interactive Canvas Particle Effect
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

// Mouse tracking for subtle interactive float response
let mouse = { x: width / 2, y: height / 2, radius: 150 };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// Particle Class
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = -Math.random() * 0.6 - 0.2; // Slow floating upwards
        this.alpha = Math.random() * 0.6 + 0.1;
        this.maxAlpha = this.alpha;

        // Color variation: Crimson Red or Off-White
        this.color = Math.random() > 0.35
            ? `rgba(230, 28, 36, ${this.alpha})`
            : `rgba(255, 255, 255, ${this.alpha * 0.5})`;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Repulsion near mouse
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
            let force = (mouse.radius - distance) / mouse.radius;
            this.x -= (dx / distance) * force * 2;
            this.y -= (dy / distance) * force * 2;
        }

        // Wrap around screens
        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
            this.reset();
            this.y = height + 10;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = this.size * 4;
        ctx.shadowColor = window.getIconGlowColor
            ? window.getIconGlowColor()
            : '#e61c24';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset blur for performance
    }

    // Re-tint particle colors when the theme changes
    applyTheme() {
        const light = document.documentElement.classList.contains('light-theme');
        this.color = light
            ? (Math.random() > 0.35
                ? `rgba(230, 28, 36, ${this.maxAlpha})`
                : `rgba(60, 60, 70, ${this.maxAlpha * 0.5})`)
            : (Math.random() > 0.35
                ? `rgba(230, 28, 36, ${this.maxAlpha})`
                : `rgba(255, 255, 255, ${this.maxAlpha * 0.5})`);
    }
}

// Initialize Particles — denser, capped higher so big screens stay atmospheric
const particleCount = Math.min(Math.floor(window.innerWidth / 7), 160);
for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// Re-tint existing particles when the theme toggle is clicked
document.getElementById('themeToggle')?.addEventListener('click', () => {
    // Delay slightly so the class toggle in theme.js applies first
    setTimeout(() => particles.forEach(p => p.applyTheme()), 0);
});

// Start particle loop when ready
window.onload = function() {
    animate();
};
