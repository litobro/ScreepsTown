function Planning(room, sources, spawns) {
    this.room = room;
    this.sources = sources;
    this.spawns = spawns;

    this.generateConstructionSites = function() {
        for(let source in this.sources) {
            this.generateRoadSites(spawns[0], this.sources[source]);
        }
    };

    this.generateRoadSites = function (origin, target) {
        let paths = PathFinder.search(origin, target);
        for(let path in paths) {
            paths[path].createConstructionSite(STRUCTURE_ROAD);
        }
    };
};

module.exports = Planning;