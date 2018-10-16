let Miner = require('./town_workers_miner');
let Builder = require('./town_workers_builder');
let Powerplant = require('./town_powerplant');

function Mayor(room) {
    this.room = room;
    this.powerplant = new Powerplant(this.room);
    this.mySpawns = room.find(FIND_MY_SPAWNS);
    this.sources = room.find(FIND_SOURCES);
    this.myCreeps = room.find(FIND_MY_CREEPS);
    this.spawnQueue = [];
    this.buildQueue = [];

    this.main = function() {
        console.log('Processing Room:', this.room.name);
        //console.log('Creeps Available:', this.myCreeps.length);
        //console.log('Sources Available:', this.sources.length);
        //console.log('Spawns Available:', this.mySpawns.length);

        // Check if enough workers to run economy
        // Should check how many free spaces around sources there are and make that many
        // miners - then assign appropriately
        this.queueWorkerSpawn(Miner.role, this.calculateTotalMinersRequired());
        this.queueWorkerSpawn(Builder.role, this.room.controller.level);

        if(this.spawnWorkers() === OK) {
            // Get those workers going!
            this.assignMiners();
            if (this.generateBuildQueue() === OK) {
                this.assignBuilders();
            }
        }
    };

    // Builds whatever is in the queue
    this.assignBuilders = function() {
        let builders = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Builder.role});

        for(let builder in builders) {
            if(this.buildQueue[0] instanceof Structure && this.buildQueue[0] !== this.room.controller) {
                Builder.repair(builders[builder], this.powerplant.getWithdrawTarget(builders[builder]), this.buildQueue[0]);
            }
            else if (this.buildQueue[0] instanceof ConstructionSite) {
                Builder.build(builders[builder], this.powerplant.getWithdrawTarget(builders[builder]), this.buildQueue[0]);
            }
            else if (this.buildQueue[0] === this.room.controller) {
                Builder.upgradeController(builders[builder], this.powerplant.getWithdrawTarget(builders[builder]), this.buildQueue[0]);
            }
        }
    };

    // Priority is repair most damaged, build most complete, upgrade room core (unless room core is about to degrade)
    // Check to see if will take more resources than necessary for spawn - if so wait
    this.generateBuildQueue = function() {
        //Emergency check to ensure we aren't downgraded
        if(this.room.controller.ticksToDowngrade < 500) {
            this.buildQueue.push(this.room.controller);
        }

        /*
        let spawnCost = 0;
        for(let part in this.spawnQueue) {
            spawnCost += BODYPART_COST[this.spawnQueue[0]];
        }
        console.log(spawnCost);
        if(spawnCost > this.room.energyAvailable && spawnCost < this.room.energyCapacityAvailable) {
            console.log('Pausing build queue to build more workers');
            return ERR_NOT_ENOUGH_ENERGY;
        }
        */

        // First figure out if anything needs repairing
        let myStructures = this.room.find(FIND_MY_STRUCTURES);
        myStructures = _.filter(myStructures, function(structure){ return structure.hits < structure.hitsMax; });
        myStructures = _.sortBy(myStructures, function(structure){ return structure.hits; });
        for(let structure in myStructures) {
            this.buildQueue.push(myStructures[structure]);
        }

        // Second build any Construction sites, order by most complete
        let constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
        constructionSites = _.sortBy(constructionSites, function(site) { return site.progress / site.progressTotal; }).reverse();
        for(let site in constructionSites) {
            this.buildQueue.push(constructionSites[site]);
        }

        // Walls don't count as my structure -.-
        let walls = this.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_WALL}});
        walls = _.sortBy(walls, function(wall){ return wall.hits / wall.hitsMax; });
        for(let wall in walls) {
            this.buildQueue.push(walls[wall]);
        }

        // Nothing else to do, upgrade controller
        this.buildQueue.push(this.room.controller);

        return OK;
    };

    // Alternate sources for miners so they are distributed according to free spaces
    this.assignMiners = function() {
        let miners = _.filter(this.myCreeps, function(creep) { return creep.memory.role === Miner.role});
        let currCreep = 0;
        for(let source in this.sources) {
            let minersRequired = this._calculateMinersForSource(this.sources[source]);
            for (let i = 0; i < minersRequired; i++) {
                if(currCreep < miners.length) {
                    Miner.run(miners[currCreep], this.sources[source], this.powerplant.getDepositTarget(miners[currCreep]));
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
            return spawn.spawnCreep(Builder.body_parts, worker_name, memory);
        }
    };

    // Queue up worker spawn for given role
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