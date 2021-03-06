let Miner = require('./town_workers_miner');
let Builder = require('./town_workers_builder');
let Hauler = require('./town_workers_hauler');
let Powerplant = require('./town_powerplant');
let Planning = require('./town_planning');

function Mayor(room) {
    this.room = room;
    this.powerplant = new Powerplant(this.room);
    this.mySpawns = room.find(FIND_MY_SPAWNS);
    this.sources = room.find(FIND_SOURCES);
    this.myCreeps = room.find(FIND_MY_CREEPS);
    this.spawnQueue = [];
    this.buildQueue = [];
    this.planning = new Planning(this.room, this.sources, this.mySpawns);

    this.buildersRequired = this.room.memory.buildersRequired || 1;

    this.main = function() {
        console.log('Processing Room:', this.room.name, 'Game Time:', Game.time);
        //console.log('Creeps Available:', this.myCreeps.length);
        //console.log('Sources Available:', this.sources.length);
        //console.log('Spawns Available:', this.mySpawns.length);

        // Check if enough workers to run economy
        this.queueWorkerSpawn(Miner.role, this.calculateTotalMinersRequired());
        this.queueWorkerSpawn(Hauler.role, this.calculateTotalHaulersRequired());
        this.queueWorkerSpawn(Builder.role, this.calculateTotalBuildersRequired());

        if(this.spawnWorkers() === OK) {
            // Get those workers going!
            this.assignMiners();
            this.assignHaulers();
            if (this.generateBuildQueue() === OK) {
                this.assignBuilders();
            }
        }

        // Every 500 ticks do this
        if(Game.time % 500 === 0) {
            this.planning.generateConstructionSites();
        }
    };
    
    // Give each hauler a container to move resources to/from (2 per container)
    this.assignHaulers = function() {
        let containers = this.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
        let haulers = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Hauler.role && !creep.spawning; });

        let currHauler = 0;
        while (currHauler < haulers.length) {
            for (let container in containers) {
                if (currHauler < haulers.length) {
                    Hauler.run(haulers[currHauler], containers[container],
                        this.powerplant.getDepositTarget(haulers[currHauler]));
                    currHauler++;
                }
            }
        }
    };

    // Builds whatever is in the queue
    this.assignBuilders = function() {
        let builders = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Builder.role && !creep.spawning});

        for(let builder in builders) {
            let assignAll = false;
            if(this.buildQueue[0] instanceof Structure && this.buildQueue[0] !== this.room.controller) {
                Builder.repair(builders[builder], this.powerplant.getWithdrawTarget(builders[builder], true), this.buildQueue[0]);
            }
            else if (this.buildQueue[0] instanceof ConstructionSite) {
                Builder.build(builders[builder], this.powerplant.getWithdrawTarget(builders[builder], true), this.buildQueue[0]);
                assignAll = true;
            }
            else if (this.buildQueue[0] === this.room.controller || this.buildQueue.length < 1) {
                Builder.upgradeController(builders[builder], this.powerplant.getWithdrawTarget(builders[builder], true), this.room.controller);
            }
            if(!assignAll) {
                this.buildQueue.shift();
            }
        }
    };

    // Priority is repair most damaged, build most complete, upgrade room core (unless room core is about to degrade)
    this.generateBuildQueue = function() {
        //Emergency check to ensure we aren't downgraded
        if(this.room.controller.ticksToDowngrade < 500) {
            this.buildQueue.push(this.room.controller);
        }

        // First figure out if anything needs repairing
        let myStructures = this._getDamagedAndSort(false);
        for(let structure in myStructures) {
            this.buildQueue.push(myStructures[structure]);
        }

        // Containers don't count as my structures
        let containers = this._getDamagedAndSort(STRUCTURE_CONTAINER);
        for(let container in containers){
            this.buildQueue.push(containers[container]);
        }

        // Second build any Construction sites, order by most complete
        let constructionSites = this.room.find(FIND_MY_CONSTRUCTION_SITES);
        constructionSites = _.sortBy(constructionSites, function(site) { return site.progress / site.progressTotal; }).reverse();
        for(let site in constructionSites) {
            this.buildQueue.push(constructionSites[site]);
        }

        // Walls don't count as my structure -.-
        let walls = this._getDamagedAndSort(STRUCTURE_WALL);
        for(let wall in walls) {
            this.buildQueue.push(walls[wall]);
        }

        // Roads don't count as my structure -.-
        let roads = this._getDamagedAndSort(STRUCTURE_ROAD);
        for(let road in roads) {
            this.buildQueue.push(roads[road]);
        }

        // Nothing else to do, upgrade controller
        this.buildQueue.push(this.room.controller);

        return OK;
    };

    // Helper for build queue generation
    this._getDamagedAndSort = function(STRUCTURE_TYPE){
        STRUCTURE_TYPE = STRUCTURE_TYPE || false;
        let structures;
        if(STRUCTURE_TYPE) {
            structures = this.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_TYPE}});
        } else {
            structures = this.room.find(FIND_MY_STRUCTURES);
        }
        structures = _.filter(structures, function(structure) { return structure.hits < structure.hitsMax; });
        structures = _.sortBy(structures, function(structure) { return structure.hits / structure.hitsMax; });
        return structures;
    };

    // Alternate sources for miners so they are distributed according to free spaces
    this.assignMiners = function() {
        let miners = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Miner.role && !creep.spawning; });
        let haulers = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Hauler.role && !creep.spawning; });
        let currCreep = 0;
        for(let source in this.sources) {
            let minersRequired = this._calculateMinersForSource(this.sources[source]);
            for (let i = 0; i < minersRequired; i++) {
                if(currCreep < miners.length) {
                    Miner.run(miners[currCreep], this.sources[source],
                        this.powerplant.getDepositTarget(miners[currCreep], (haulers.length > 0)));
                    currCreep++;
                }
            }
        }
    };

    // Calculate free spaces next to sources
    this.calculateTotalMinersRequired = function() {
        let count = 0;
        for(let source in this.sources) {
            count += this._calculateMinersForSource(this.sources[source]);
        }
        return count;
    };

    // Calculate free space next to source
    this._calculateMinersForSource = function(source) {
        let fields = room.lookForAtArea(LOOK_TERRAIN, source.pos.y - 1, source.pos.x - 1, source.pos.y + 1, source.pos.x + 1, true);
        return 9 - _.countBy(fields, 'terrain').wall;
    };

    this.calculateTotalHaulersRequired = function() {
        let containers = this.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}});
        return 1 * containers.length;
    };

    this.calculateTotalBuildersRequired = function() {
        if(this.room.energyAvailable === this.room.energyCapacityAvailable && !this.mySpawns[0].spawning) {
            this.room.memory.buildersRequired++;
        }
        if(this.room.energyAvailable < 50 && this.room.memory.buildersRequired > 0) {
            this.room.memory.buildersRequired--;
        }
        this.buildersRequired = this.room.memory.buildersRequired;
        return this.buildersRequired;
    };

    // Spawns workers from queue
    // TODO: Implement multiple spawn support
    this.spawnWorkers = function(spawn) {
        // Spawn any workers waiting in queue at spawn site
        if(this.spawnQueue.length > 0) {
            // If spawn successful, remove from queue
            if (this._spawnWorker(this.spawnQueue[0], this.mySpawns[0]) === OK) {
                this.spawnQueue.shift();
            }
        }
        return OK;
    };

    // Helper for spawnWorkers
    // Worker role to object association done here
    this._spawnWorker = function(role, spawn) {
        let worker_name = this.room.name + '_' + role.toString() + Game.time.toString();
        let memory = {memory: {role: role}};
        if(role === Miner.role) {
            return spawn.spawnCreep(Miner.get_body_parts(this.room), worker_name, memory);
        }
        else if (role === Builder.role) {
            return spawn.spawnCreep(Builder.get_body_parts(this.room), worker_name, memory);
        }
        else if(role === Hauler.role) {
            return spawn.spawnCreep(Hauler.get_body_parts(this.room), worker_name, memory);
        }
    };

    // Queue up worker spawn for given role
    this.queueWorkerSpawn = function(role, quantity) {
        let workers = _.filter(this.myCreeps, function(creep) { return creep.memory.role === role});
        if (workers.length < quantity) {
            console.log('Not enough', role, '... Have:', workers.length, ' Want:', quantity);
            while(_.filter(this.spawnQueue, function(name) { return name === role}).length < quantity - workers.length) {
                this.spawnQueue.push(role);
            }
        }
        else if (workers.length > quantity){
            workers[0].suicide();
        }
    };
}

module.exports = Mayor;