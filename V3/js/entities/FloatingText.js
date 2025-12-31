export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color || '#fff';
        this.life = 3.0;
        this.vy = -1;
        this.active = true;
    }

    update(dt) {
        this.y += this.vy * dt * 60;
        this.life -= 0.016 * dt * 60;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;

        // Vibrant color cycle
        const hue = (Date.now() / 10) % 360;
        ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
        ctx.font = 'bold 32px Courier New';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 8;
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}
