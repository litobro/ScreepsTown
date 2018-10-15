let Miner = require('./town_workers_miner');

function Mayor(room) {
    this.room = room;
    this.taskQueue = [];
    this.sources = [];
    this.myCreeps = [];

    this.main = function() {
        console.log('Processing Room: ', this.room.name);

        this.myCreeps = room.find(FIND_MY_CREEPS);
        console.log('Creeps Available: ', this.myCreeps.length);
        this.sources = room.find(FIND_SOURCES);
        console.log('Sources Available: ', this.sources.length);
    }
}

module.exports = Mayor;