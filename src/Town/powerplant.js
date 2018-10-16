function Powerplant(room){
    this.room = room;
    this.targets = this.room.find(FIND_MY_STRUCTURES);
    this.targets = _.filter(this.targets, function(target){ return target.structureType === STRUCTURE_SPAWN || target.structureType === STRUCTURE_EXTENSION || target.structureType === STRUCTURE_CONTAINER; });

    // findClosestByPath of non full target
    this.getDepositTarget = function(creep){
        let targets = _.filter(this.targets, function(target){ return target.energy < target.energyCapacity; });
        return creep.pos.findClosestByPath(targets);
    };

    // findClosestByPath of full or partially full (70%) target
    this.getWithdrawTarget = function(creep) {
        let targets = _.filter(this.targets, function(target){ return target.energy / target.energyCapacity > 0.25; });
        return creep.pos.findClosestByPath(targets);
    };
}

module.exports = Powerplant;