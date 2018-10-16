function Powerplant(room){
    this.room = room;
    this.targets = this.room.find(FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_SPAWN || STRUCTURE_EXTENSION || STRUCTURE_CONTAINER}});

    // findClosestByPath of non full target
    this.getDepositTarget = function(creep){
        let targets = _.filter(this.targets, function(target){ return target.energy < target.energyCapacity; });
        return creep.pos.findClosestByPath(targets);
    };

    // findClosestByPath of full or partially full (80%) target
    this.getWithdrawTarget = function(creep) {
        let targets = _.filter(this.targets, function(target){ return target.energy / target.energyCapacity >= 0.8; })
        return creep.pos.findClosestByPath(targets);
    };
}

module.exports = Powerplant;