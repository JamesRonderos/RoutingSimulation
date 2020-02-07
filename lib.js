/*----------------------------------------------------------------------
  PROTOTYPES
  ----------------------------------------------------------------------*/

Array.prototype.remove = function(item) {
    let index = this.indexOf(item);
    if (index !== -1)
        this.splice(index, 1);
    return this;
};

/*----------------------------------------------------------------------
  MISC FUNCTIONS
  ----------------------------------------------------------------------*/

const Link = (source, target) => [source,target]; // semantic sugar
const intersection = (a,b) => a.filter(x => b.includes(x));

function isset() {
    var a = arguments, l = a.length, i = 0, undef;
    if (l === 0)
        return false;
    while (i !== l) {
        if (a[i] === undef || a[i] === null)
            return false;
        i++;
    }
    return true;
}

function empty(o) {
    if (!isset(o))
        return true;
    if (typeof o === 'object' && o.constructor === Object && Object.keys(o).length === 0)
        return true;
    if (o.hasOwnProperty('length') && o.length === 0)
        return true;
    return o == false;
};

function minByValueFn(arr, valueFn) {
    let minKey = undefined,
        minValue = undefined;

    arr.forEach(k => {
        let v = valueFn(k);

        if (typeof minValue === 'undefined' || v < minValue) {
            minKey = k;
            minValue = v;
        }
    });

    return minKey;
}

function promptForCost(existingLinkName = null) {
    let cost, value, invalid = false;
    while (true) {
        value = prompt((invalid ? 'Not a valid number, try again.\n' : '')
            + 'Enter link cost' + (existingLinkName ? ' for ' + existingLinkName : '') + ':');
        if (!value) {
            cost = undefined;
            break;
        }
        cost = parseInt(value);
        if (!isNaN(cost)) {
            break;
        }
    }
    return cost;
}

/*----------------------------------------------------------------------
  NETWORK DATA STRUCTURE
  ----------------------------------------------------------------------*/

class Network {

    constructor() {
        this.vis = new Vis(this);
        this.clear();
    }

    clear() {
        this.nodes = new Set(); // set of nodes
        this.positions = new DefaultDict(null);
        this.neighbours = new DefaultDict(Set); // adjacency list
        this.costs = new DefaultDict(NaN); // Link(source_node,target_node) => cost
    }

    updateVis() {
        this.vis.update();
    }

    // ----------------------------------------------------------------------
    // NODE FUNCTIONS

    add_node(id, x, y) {
        if (this.nodes.has(id)) {
            return false;
        }
        this.nodes.add(id);
        this.positions[id] = {x,y};
        return this;
    }

    has_node(id) {
        return this.nodes.has(id);
    }

    num_nodes() {
        return this.nodes.length;
    }

    delete_node(id) {
        this.neighbours[id].forEach(V => {
            this.delete_link(Link(id, V));
            this.delete_link(Link(V, id));
        });

        this.nodes.delete(id);
        delete this.positions[id];
    }

    // ----------------------------------------------------------------------
    // LINK FUNCTIONS

    /**
     * Add a new link.
     */
    add_link([from_node, to_node], cost) {
        if (isNaN(cost))
            return this;

        this.neighbours[from_node].add(to_node);
        this.neighbours[to_node].add(from_node);

        this.costs[Link(from_node, to_node)] = cost;
        this.costs[Link(to_node, from_node)] = cost;

        return this;
    }

    /**
     * Check if a link exists.
     */
    has_link([from_node, to_node]) {
        return this.neighbours[from_node].has(to_node);
    }

    /**
     * Delete a link.
     */
    delete_link([from_node, to_node]) {
        this.neighbours[from_node].delete(to_node);
        this.neighbours[to_node].delete(from_node);

        delete this.costs[Link(from_node, to_node)];
        delete this.costs[Link(to_node, from_node)];

        return this;
    }

    /**
     * Get the cost of an existing link.
     */
    get_cost([from_node, to_node]) {
        return this.costs[Link(from_node, to_node)];
    }

    /**
     * Set the cost of an existing link.
     */
    set_cost([from_node, to_node], cost) {
        if (isNaN(cost))
            return this;
        this.costs[Link(from_node, to_node)] = cost;
        this.costs[Link(to_node, from_node)] = cost;
        return this;
    }

    // ----------------------------------------------------------------------
    // ROUTING FUNCTIONS

    __minNode(Q, dist) {
        let current = intersection(Q, Object.keys(dist));
        return empty(current) ? undefined : minByValueFn(current, k => dist[k]);
    }

    dijkstra(source, maxD=null) {
        let path = {}, // prev paths
            Q = Array.from(this.nodes), // clone vertex set
            dist = {};

        this.nodes.forEach(node => dist[node] = Infinity);
        dist[source] = 0;

        while (Q.length) {
            let U = this.__minNode(Q, dist); // get node in Q with min dist

            Q.remove(U);

            this.neighbours[U].forEach(V => {
                let D = dist[U] + this.costs[Link(U, V)];
                if (dist[V] > D && (!maxD || maxD >= D)) {
                    dist[V] = D;
                    path[V] = U;
                }
            });
        }

        return [dist, path];
    }

    shortest_path(start, end) {
        let [dist, path] = this.dijkstra(start);
        let full_path = [end];
        let _end = end;

        while (_end != start) {
            _end = path[_end];
            if (!_end) {
                full_path = null;
                break;
            }
            full_path.unshift(_end);
        }

        let full_score = dist[end];

        return full_path;
    }
}

/*----------------------------------------------------------------------
  3RD PARTY CODE
  ----------------------------------------------------------------------*/

/**
 * ref: https://stackoverflow.com/a/44622467/2014481
 * JavaScript implementation of python's standard DefaultDict
 */
class DefaultDict {
    constructor(defaultInit) {
        return new Proxy({}, {
            get: (target, name) => name in target ?
                target[name] :
                (target[name] = typeof defaultInit === 'function' ?
                      new defaultInit().valueOf() :
                      defaultInit)
        })
    }
}