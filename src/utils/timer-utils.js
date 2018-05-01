'use strict';

class Timer {
    constructor() {
        this.status = 'started';
        this.start();
    }

    start() {
        this.status = 'started';
        this.startTick = process.hrtime();
        this.startTickMs = this.startTick[0] * 1e3 + this.startTick[1] / 1e6;
        this.stopTickMs = undefined;
    }

    stop() {
        this.status = 'stoped';
        this.stopTick = process.hrtime();
        this.stopTickMs = this.stopTick[0] * 1e3 + this.stopTick[1] / 1e6;
        return this.stopTickMs - this.startTickMs;
    }

    stopAndGetDuration() {
        if (this.status === 'started') {
            this.stop();
        }
        return this.getDuration();
    }

    getDuration() {
        if (this.status === 'stoped') {
            return this.stopTickMs - this.startTickMs;
        } else {
            let nowTick = process.hrtime();
            this.nowTickMs = nowTick[0] * 1e3 + nowTick[1] / 1e6;
            return this.nowTickMs - this.startTickMs;
        }
    }
}

module.exports = {
    Timer
};