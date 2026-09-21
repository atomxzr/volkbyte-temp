// Adaptive Icon Theming
// Samples the colors of icons/icon.svg (whatever file sits there) and feeds
// the dominant bright colors into CSS custom properties, so the ambient glow,
// core backlight, hover shadows and particle tint all follow the icon.
//
// If anything fails (missing icon, canvas blocked, etc.) the CSS fallback
// values (the default crimson) remain in effect.

(function () {
    'use strict';

    const ICON_PATH = 'icons/icon.svg';
    const SAMPLE_SNAP = 64;          // analysis canvas size for speed
    const MIN_BRIGHTNESS = 0.18;     // ignore very dark pixels (silhouette)
    const MIN_SATURATION = 0.25;     // ignore greys/whites for "accent" color

    function setVars(primary, secondary) {
        const root = document.documentElement.style;
        // Ambient gradient + core backlight
        root.setProperty('--icon-glow-primary', primary);
        root.setProperty('--icon-glow-secondary', secondary);
        // Shadows with fixed alpha channels
        root.setProperty('--icon-glow-shadow', hexToRgba(primary, 0.40));
        root.setProperty('--icon-glow-shadow-hover', hexToRgba(primary, 0.65));
        // Particles read this in particles.js
        root.setProperty('--icon-glow-particle', hexToRgba(primary, 1));
    }

    function hexToRgba(hex, alpha) {
        const n = parseInt(hex.slice(1), 16);
        const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function analyze(img) {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SNAP;
        canvas.height = SAMPLE_SNAP;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SAMPLE_SNAP, SAMPLE_SNAP);

        let data;
        try {
            data = ctx.getImageData(0, 0, SAMPLE_SNAP, SAMPLE_SNAP).data;
        } catch (e) {
            return null; // canvas tainted (e.g. cross-origin) — keep fallback
        }

        // Bucket pixels by hue (12 buckets). Track brightness per bucket to
        // separate the main accent (brightest, most saturated) from a
        // secondary accent (next-brightest distinct hue).
        const buckets = {};
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
            if (a < 128) continue; // transparent

            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const v = max / 255;
            const s = max === 0 ? 0 : (max - min) / max;

            if (v < MIN_BRIGHTNESS) continue;      // dark silhouette
            if (s < MIN_SATURATION) continue;      // white/greys

            let h = 0;
            if (max !== min) {
                const d = max - min;
                if (max === r) h = ((g - b) / d) % 6;
                else if (max === g) h = (b - r) / d + 2;
                else h = (r - g) / d + 4;
                h = (h * 60 + 360) % 360;
            }

            const bucket = Math.floor(h / 30);
            if (!buckets[bucket]) buckets[bucket] = { count: 0, r: 0, g: 0, b: 0, score: 0 };
            const bk = buckets[bucket];
            bk.count++; bk.r += r; bk.g += g; bk.b += b;
            // Score favors saturated + bright + frequent
            bk.score += s * v;
        }

        const entries = Object.values(buckets)
            .map(bk => ({
                count: bk.count,
                r: Math.round(bk.r / bk.count),
                g: Math.round(bk.g / bk.count),
                b: Math.round(bk.b / bk.count),
                avgScore: bk.score / bk.count,
            }))
            .sort((p, q) => q.avgScore * Math.sqrt(q.count) - p.avgScore * Math.sqrt(p.count));

        if (!entries.length) return null;

        const css = (c) => '#' + [c.r, c.g, c.b].map(v => v.toString(16).padStart(2, '0')).join('');

        const primary = css(entries[0]);
        // Secondary: a different hue bucket if available, otherwise a
        // darkened version of the primary for gradient depth.
        const secEntry = entries.find(c => c !== entries[0]);
        const secondary = secEntry ? css(secEntry) : shade(primary, 0.6);

        return { primary, secondary };
    }

    function shade(hex, factor) {
        const n = parseInt(hex.slice(1), 16);
        const sh = v => Math.max(0, Math.min(255, Math.round(v * factor)));
        return '#' + [sh((n >> 16) & 255), sh((n >> 8) & 255), sh(n & 255)]
            .map(v => v.toString(16).padStart(2, '0')).join('');
    }

    // Manuale CSS-var computation: read var, else fallback
    window.getIconGlowColor = function () {
        return getComputedStyle(document.documentElement)
            .getPropertyValue('--icon-glow-particle').trim() || 'rgba(230, 28, 36, 1)';
    };

    const img = new Image();
    img.onload = function () {
        const result = analyze(img);
        if (result) setVars(result.primary, result.secondary);
    };
    img.onerror = function () { /* keep CSS fallbacks */ };
    img.src = ICON_PATH;
})();
