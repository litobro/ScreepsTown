let Miner = require('./town_workers_miner');

function Mayor(room) {
    this.room = room;
    this.mySpawns = room.find(FIND_MY_SPAWNS);
    this.sources = room.find(FIND_SOURCES);
    this.myCreeps = room.find(FIND_MY_CREEPS);
    this.spawnQueue = [];

    this.main = function() {
        console.log('Processing Room:', this.room.name);
        console.log('Creeps Available:', this.myCreeps.length);
        console.log('Sources Available:', this.sources.length);
        console.log('Spawns Available:', this.mySpawns.length);

        // Check if enough miners to run economy
        this.queueWorkerSpawn(Miner.role, 2 * this.sources.length);

        // Spawn any workers waiting in queue at spawn site
        if(this.spawnQueue.length > 0) {
            // If spawn successful, remove from queue
            if (this.spawnWorker(this.spawnQueue[0], this.mySpawns[0]) === OK) {
                this.spawnQueue.shift();
            }
        }

        // Get those miners going!
        this.assignMiners();
    };

    // Alternate sources for miners so they are evenly distributed
    this.assignMiners = function() {
        let miners = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Miner.role});
        let currCreep = 0;
        while(currCreep < miners.length - 1) {
            for (let source in this.sources) {
                Miner.run(miners[currCreep++], this.sources[source], this.mySpawns[0])
            }
        }
    };

    this.spawnWorker = function(role, spawn) {
        let worker_count = _.filter(this.myCreeps, function(creep) { return creep.memory.role === role}).length;
        if(role === Miner.role) {
            return spawn.spawnCreep(Miner.body_parts, this.room.name + '_' + role.toString() + worker_count.toString(),
                {memory: {role: role}});
        }
    };

    this.queueWorkerSpawn = function(role, quantity) {
        let worker_count = _.filter(this.myCreeps, function(creep) { return creep.memory.role === role}).length;
        if (worker_count < quantity) {
            console.log('Not enough', role, '... Have:', worker_count, ' Want:', quantity);
            while(_.filter(this.spawnQueue, function(name) { return name === role}).length < quantity) {
                this.spawnQueue.push(role);
            }
        }
    };
}

module.exports = Mayor;