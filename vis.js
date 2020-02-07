class Vis {

    constructor(myNet) {
        this.myNet = myNet;
        this.nodes = [];
        this.links = [];
        this.dragLine = null;
        this.dragPrevHovered = null;

        // --------------------------------------------------------------------------------
        // Setup container
        this.width = document.getElementById('d3-graph').getBoundingClientRect().width;
        this.height = document.getElementById('d3-graph').getBoundingClientRect().height;

        this.svg = d3.select('#d3-graph');
        this.svg_g = d3.select('#d3-graph')
            .append('g');

        // --------------------------------------------------------------------------------
        // Setup elements
        this.linkElements = null;
        this.nodeElements = null;
        this.nodeTextElements = null;
        this.linkTextElements = null;

        // --------------------------------------------------------------------------------
        // Setup drag behavior
        this.drag = d3.drag()
            .on("drag", (node, i ,nodes) => {
                let noModifiers = !d3.event.sourceEvent.ctrlKey && !d3.event.sourceEvent.altKey
                    && !d3.event.sourceEvent.shiftKey && !d3.event.sourceEvent.metaKey;

                if (this.dragLine) {
                    let px = d3.event.sourceEvent.pageX;
                    let py = d3.event.sourceEvent.pageY;

                    if (isset(this.dragPrevHovered)) {
                        d3.select(this.dragPrevHovered).classed('red', false);
                        this.dragPrevHovered = null;
                    }

                    let elements = document.elementsFromPoint(px, py);
                    for (let i = 0; i < elements.length; i++) {
                        let el = elements[i];

                        if (el.tagName.toUpperCase() === 'CIRCLE' && el.hasAttribute('data-id')) {
                            if (el.getAttribute('data-id') == node.id) {
                                continue;
                            }
                            d3.select(el).classed('red', true);
                            this.dragPrevHovered = el;
                        }
                    }

                    this.dragLine
                        .attr('x2', px - this.get_x())
                        .attr('y2', py - this.get_y());
                } else if (noModifiers) {
                    this.myNet.positions[node.id].x += d3.event.dx;
                    this.myNet.positions[node.id].y += d3.event.dy;
                    this.tick();
                }
            })
            .on('start', (node, i ,nodes) => {
                if (d3.event.sourceEvent.shiftKey) {
                    this.dragLine = this.svg_g.append('line')
                        .attr('class', 'drag_line')
                        .attr('x1', this.myNet.positions[node.id].x)
                        .attr('y1', this.myNet.positions[node.id].y)
                        .attr('x2', d3.event.sourceEvent.pageX - this.get_x())
                        .attr('y2', d3.event.sourceEvent.pageY - this.get_y());
                    d3.select(nodes[i]).classed('red', true);
                }
            })
            .on('end', (node, i ,nodes) => {
                if (this.dragLine) {
                    this.dragLine.remove();
                    this.dragLine = null;

                    d3.select(nodes[i]).classed('red', false);

                    if (isset(this.dragPrevHovered)) {
                        d3.select(this.dragPrevHovered).classed('red', false);
                        this.dragPrevHovered = null;
                    }

                    let px = d3.event.sourceEvent.pageX;
                    let py = d3.event.sourceEvent.pageY;

                    let elements = document.elementsFromPoint(px, py);
                    for (let i = 0; i < elements.length; i++) {
                        let el = elements[i];

                        if (el.tagName.toUpperCase() === 'CIRCLE' && el.hasAttribute('data-id')) {
                            let link = Link(node.id, el.getAttribute('data-id'));

                            if (this.myNet.has_link(link)) {
                                alert(`Link between ${link[0]} and ${link[1]} already exists.`);
                                return;
                            }

                            this.myNet.add_link(link, promptForCost());
                            this.update();
                        }
                    }
                }
            });

        // --------------------------------------------------------------------------------
        // Setup doubleclick
        this.svg.on("dblclick", () => {
            let elements = document.elementsFromPoint(d3.event.pageX, d3.event.pageY);
            for (let i = 0; i < elements.length; i++) {
                let el = elements[i];
                if (el.tagName.toUpperCase() === 'CIRCLE' && el.hasAttribute('data-id')) {
                    alert('There\'s a node already at that location.');
                    return;
                }
            }

            let x = d3.event.pageX - this.get_x();
            let y = d3.event.pageY - this.get_y();

            let name = prompt('Enter node name');
            if (name) {
                if (!this.myNet.add_node(name, x, y)) {
                    alert('There\'s already a node with that name.');
                } else {
                    this.update();
                }
            }
        });
    }

    get_x() {
        return document.getElementById('d3-graph').getBoundingClientRect().x;
    }
    get_y() {
        return document.getElementById('d3-graph').getBoundingClientRect().y;
    }

    update() {
        this.nodes = Array.from(this.myNet.nodes).map(node => {
            return { id: node, label: node };
        });

        this.links = [];

        for (let node of this.myNet.nodes) {
            for (let adjNode of this.myNet.neighbours[node]) {
                this.links.push({
                    source: node,
                    target: adjNode,
                    cost: this.myNet.get_cost(Link(node, adjNode)),
                });
            }
        }

        if (this.linkElements) this.linkElements.remove();
        if (this.nodeElements) this.nodeElements.remove();
        if (this.nodeTextElements) this.nodeTextElements.remove();
        if (this.linkTextElements) this.linkTextElements.remove();

        this.linkElements = this.svg_g.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(this.links)
            .enter().append("line")
                .attr("data-link", d => d.source+'-'+d.target)
                .on("mouseover", function() {
                    d3.select(this).classed('hovered', true);
                })
                .on("mouseout", function() {
                    d3.select(this).classed('hovered', false);
                });

        this.nodeElements = this.svg_g.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(this.nodes)
            .enter().append("circle")
                .attr("r", 8)
                .attr("data-id", node => node.id)
                .call(this.drag)
                .on('click', node => {
                    if (d3.event.ctrlKey) {
                        this.myNet.delete_node(node.id);
                        this.update();
                    }
                })
                .on("mouseover", function() {
                    d3.select(this).classed('hovered', true);
                })
                .on("mouseout", function() {
                    d3.select(this).classed('hovered', false);
                });

        this.linkTextElements = this.svg_g.append("g")
            .attr("class", "link_texts")
            .selectAll("text")
            .data(this.links)
            .enter().append("text")
                .text(link => link.cost)
                .attr("dx", 4)
                .attr("dy", 4)
                .on('dblclick', link => {
                    d3.event.stopPropagation();
                    let o = Link(link.source, link.target);
                    this.myNet.set_cost(o, promptForCost(o.join('-')));
                    this.update();
                })
                .on('click', link => {
                    if (d3.event.ctrlKey) {
                        this.myNet.delete_link(Link(link.source, link.target));
                        this.update();
                    }
                })
                .on("mouseover", function() {
                    d3.select(this).classed('hovered', true);
                })
                .on("mouseout", function() {
                    d3.select(this).classed('hovered', false);
                });

        this.nodeTextElements = this.svg_g.append("g")
            .attr("class", "node_texts")
            .selectAll("text")
            .data(this.nodes)
            .enter().append("text")
                .text(node => node.label)
                .attr("dx", 12)
                .attr("dy", 4)
                .on('click', node => {
                    if (d3.event.ctrlKey) {
                        this.myNet.delete_node(node.id);
                        this.update();
                    }
                })
                .on("mouseover", function() {
                    d3.select(this).classed('hovered', true);
                })
                .on("mouseout", function() {
                    d3.select(this).classed('hovered', false);
                });

        this.tick();
    }

    tick() {
        this.linkElements
            .attr('x1', d => this.myNet.positions[d.source].x)
            .attr('y1', d => this.myNet.positions[d.source].y)
            .attr('x2', d => this.myNet.positions[d.target].x)
            .attr('y2', d => this.myNet.positions[d.target].y);
        this.nodeElements
            .attr("cx", node => this.myNet.positions[node.id].x)
            .attr("cy", node => this.myNet.positions[node.id].y);
        this.nodeTextElements
            .attr('x', node => this.myNet.positions[node.id].x)
            .attr('y', node => this.myNet.positions[node.id].y);
        this.linkTextElements
            .attr('x', d => (this.myNet.positions[d.source].x + this.myNet.positions[d.target].x) / 2)
            .attr('y', d => (this.myNet.positions[d.source].y + this.myNet.positions[d.target].y) / 2);
    }

}