const Builder = {
    body_parts: [WORK, CARRY, MOVE],
    get_body_parts: function(room) {
        if (room.energyAvailable >= 400) {
            return [WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
        return [WORK, CARRY, MOVE];
    },
    role: 'builder',
    get_energy_or_continue: function(creep, source) {
        if(creep.carry.energy > 0) {
            return OK;
        }
        else {
            if (creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.travelTo(source);
            }
            return ERR_NOT_ENOUGH_ENERGY;
        }
    },
    build: function(creep, source, target) {
        if(this.get_energy_or_continue(creep, source) === OK) {
            if(creep.build(target) === ERR_NOT_IN_RANGE) {
                creep.travelTo(target);
            }
        }
    },
    repair: function(creep, source, target) {
        if(this.get_energy_or_continue(creep, source) === OK) {
            if(creep.repair(target) === ERR_NOT_IN_RANGE) {
                creep.travelTo(target);
            }
        }
    },
    upgradeController: function(creep, source, target){
        if(this.get_energy_or_continue(creep, source) === OK) {
            if(creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
                creep.travelTo(target);
            }
        }
    },
};

module.exports = Builder;