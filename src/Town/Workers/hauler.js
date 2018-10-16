const Hauler = {
    role: 'hauler',
    get_body_parts: function(room) {
        return [CARRY, CARRY, MOVE, MOVE];
    },
    run: function(creep, source, target) {
        if(creep.carry.energy > 0) {
            if(creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.travelTo(target);
            }
        }
        else {
            if(creep.withdraw(source, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                creep.travelTo(source);
            }
        }
    },
};

module.exports = Hauler;