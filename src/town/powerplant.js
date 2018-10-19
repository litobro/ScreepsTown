function Powerplant(room){
    this.room = room;
    this.targets = this.room.find(FIND_MY_STRUCTURES);
    this.targets = _.filter(this.targets, function(target){ return target.structureType === STRUCTURE_SPAWN || target.structureType === STRUCTURE_EXTENSION; });
    this.targets = _.filter(this.room.find(FIND_STRUCTURES, {filter: {structureType: STRUCTURE_CONTAINER}})).concat(this.targets);

    // findClosestByPath of non full target
    this.getDepositTarget = function(creep, container){
        container = container || false;
        let targets = null;
        if(container) {
            targets = _.filter(this.targets, function (target) {
                return target.energy < target.energyCapacity || _.sum(target.store) < target.storeCapacity;
            });
        }
        else{
            targets = _.filter(this.targets, function (target) {
                return target.energy < target.energyCapacity;
            });
        }
        return creep.pos.findClosestByPath(targets);
    };

    // findClosestByPath of full or partially full (70%) target
    this.getWithdrawTarget = function(creep, container) {
        container = container || false;
        let targets = null;
        if(container) {
            targets = _.filter(this.targets, function (target) {
                if(target instanceof StructureContainer) {
                    return target.energy / target.energyCapacity > 0.25 || target.store.energy > 0;
                }
                else {
                    return target.energy / target.energyCapacity > 0.25;
                }
            });
        }
        else {
            targets = _.filter(this.targets, function(target) {
                return target.energy / target.energyCapacity > 0.25;
            });
        }
        return creep.pos.findClosestByPath(targets);
    };
}

module.exports = Powerplant;