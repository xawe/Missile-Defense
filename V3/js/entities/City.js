import { CONSTANTS } from '../constants.js';

export class City {
    constructor(x) {
        this.x = x;
        this.y = CONSTANTS.CANVAS_HEIGHT - 40;
        this.width = 40;
        this.height = 20;
        this.active = true;
        this.color = CONSTANTS.COLOR_CITY;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);

        ctx.fillStyle = '#000';
        ctx.shadowBlur = 0;
        ctx.fillRect(this.x - 10, this.y + 5, 4, 4);
        ctx.fillRect(this.x + 5, this.y + 5, 4, 4);
    }
}
