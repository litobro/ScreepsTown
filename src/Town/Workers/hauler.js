const Hauler = {
    role: 'hauler',
    get_body_parts: function(room) {
        return [CARRY, CARRY, MOVE, MOVE];
    },
    run: function(creep, source, target) {
        if(creep.carry.energy < creep.carryCapacity) {
            if(creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.travelTo(source);
            }
        }
        else {
            if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.travelTo(target);
            }
        }
    },
};

module.exports = Hauler;