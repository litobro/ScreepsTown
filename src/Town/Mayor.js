let Miner = require('./town_workers_miner');
let Builder = require('./town_workers_builder');
let Powerplant = require('./town_powerplant');

function Mayor(room) {
    this.room = room;
    this.powerplant = Powerplant(this.room);
    this.mySpawns = room.find(FIND_MY_SPAWNS);
    this.sources = room.find(FIND_SOURCES);
    this.myCreeps = room.find(FIND_MY_CREEPS);
    this.spawnQueue = [];
    this.repairQueue = [];
    this.buildQueue = [];

    this.main = function() {
        console.log('Processing Room:', this.room.name);
        //console.log('Creeps Available:', this.myCreeps.length);
        //console.log('Sources Available:', this.sources.length);
        //console.log('Spawns Available:', this.mySpawns.length);

        // Check if enough workers to run economy
        this.queueWorkerSpawn(Miner.role, 3 * this.sources.length);
        this.queueWorkerSpawn(Builder.role, 2);
        //console.log('Current Spawn Queue: ', this.spawnQueue.join(", "));
        this.spawnWorkerQueue();


        // Get those workers going!
        this.assignMiners();
        this.assignBuilders();
    };

    // TODO: Implement priority manager for repairing, building, and upgrading
    this.assignBuilders = function() {
        let builders = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Builder.role});
        for(let builder in builders) {
            Builder.upgradeController(builders[builder], this.mySpawns[0], this.room.controller);
        }
    };

    // Alternate sources for miners so they are evenly distributed
    this.assignMiners = function() {
        let miners = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Miner.role});
        let currCreep = 0;
        while(currCreep < miners.length) {
            for (let source in this.sources) {
                if (currCreep < miners.length) {
                    Miner.run(miners[currCreep++], this.sources[source], this.mySpawns[0])
                }
            }
        }
    };

    this.spawnWorkerQueue = function() {
        // Spawn any workers waiting in queue at spawn site
        if(this.spawnQueue.length > 0) {
            // If spawn successful, remove from queue
            if (this._spawnWorker(this.spawnQueue[0], this.mySpawns[0]) === OK) {
                this.spawnQueue.shift();
            }
        }
    };

    this._spawnWorker = function(role, spawn) {
        let worker_name = this.room.name + '_' + role.toString() + Game.time.toString();
        let memory = {memory: {role: role}};
        if(role === Miner.role) {
            return spawn.spawnCreep(Miner.body_parts, worker_name, memory);
        }
        else if (role === Builder.role) {
            return spawn.spawnCreep(Builder.body_parts, worker_name, memory);
        }
    };

    this.queueWorkerSpawn = function(role, quantity) {
        let worker_count = _.filter(this.myCreeps, function(creep) { return creep.memory.role === role}).length;
        if (worker_count < quantity) {
            console.log('Not enough', role, '... Have:', worker_count, ' Want:', quantity);
            while(_.filter(this.spawnQueue, function(name) { return name === role}).length < quantity - worker_count) {
                this.spawnQueue.push(role);
            }
        }
    };
}

module.exports = Mayor;