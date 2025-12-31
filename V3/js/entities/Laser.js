import { CONSTANTS } from '../constants.js';

export class Laser {
    constructor(startX, startY, targetX, targetY, isShortRange = false) {
        this.startX = startX;
        this.startY = startY;

        const angle = Math.atan2(targetY - this.startY, targetX - this.startX);

        let length = Math.max(CONSTANTS.CANVAS_WIDTH, CONSTANTS.CANVAS_HEIGHT) * 1.5;
        if (isShortRange) length = Math.hypot(targetX - startX, targetY - startY);

        this.endX = this.startX + Math.cos(angle) * length;
        this.endY = this.startY + Math.sin(angle) * length;

        this.life = 1.0;
        this.decay = 0.012;
        if (isShortRange) this.decay = 0.1;

        this.active = true;
        this.width = isShortRange ? 2 : 4;
        this.color = isShortRange ? '#00ff00' : '#ff00ff';
    }

    update(dt) {
        this.life -= this.decay * dt * 60;
        if (this.life <= 0) this.active = false;
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.globalCompositeOperation = 'lighter';

        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = this.width;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.endX, this.endY);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width * 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = this.color;
        ctx.stroke();

        ctx.restore();
    }
}
