d3 = require("d3@5");

function table(arrayOfRecords) {
    const keys = Object.keys(arrayOfRecords[0]);
    const table = html`<table>`;
  
    const thead = html`<thead>`;
    table.appendChild(thead);
    thead.appendChild(html`<th>index`);
    keys.forEach(key => {
      thead.appendChild(html`<th>${key}`);
    });
  
    const tbody = html`<tbody>`;
    table.appendChild(tbody);
    arrayOfRecords.forEach((record, index) => {
      const tr = html`<tr>`;
      tbody.appendChild(tr);
      tr.appendChild(html`<th>${index}`);
      keys.forEach(key => {
        tr.appendChild(html`<td>${record[key]}`);
      });
    });
  
    // TODO: click to edit
    return table;
  };

diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

tree = d3.tree().nodeSize([dx, dy]);

flatData = [
    {
      id: 'a',
      name: 'Brap',
      title: 'Chef',
      manager: undefined,
      img: 'https://www.fillmurray.com/48/48'
    },
    {
      id: 'b',
      name: 'Mulofard',
      title: 'Sous',
      manager: 'a',
      img: 'https://www.fillmurray.com/47/47'
    },
    {
      id: 'c',
      name: 'Quijambrie',
      title: 'Head Pinker',
      manager: 'a',
      img: 'https://www.fillmurray.com/46/45'
    },
    {
      id: 'd',
      name: 'Elofince',
      title: 'Cheif Shaffer',
      manager: 'a',
      img: 'https://www.fillmurray.com/45/45'
    },
    {
      id: 'e',
      name: 'Praddline',
      title: 'Tail of Hearts',
      manager: 'a',
      img: 'https://www.fillmurray.com/44/44'
    },
    {
      id: 'f',
      name: 'Distinary',
      title: 'Comrade',
      manager: 'b',
      img: 'https://www.fillmurray.com/43/43'
    },
    {
      id: 'g',
      name: 'Mumpsford',
      title: 'Collaborator',
      manager: 'b',
      img: 'https://www.fillmurray.com/42/42'
    },
    {
      id: 'h',
      name: 'Smithothy',
      title: 'Cooperator',
      manager: 'b',
      img: 'https://www.fillmurray.com/41/41'
    },
    {
      id: 'i',
      name: 'Zeph',
      title: '🌬',
      manager: 'c',
      img: 'https://www.fillmurray.com/40/40'
    },
    {
      id: 'j',
      name: 'Juice',
      title: 'Hmm',
      manager: 'c',
      img: 'https://www.fillmurray.com/49/49'
    },
    {
      id: 'k',
      name: 'Klabørd',
      title: 'Actuary',
      manager: 'j',
      img: 'https://www.fillmurray.com/50/50'
    },
    {
      id: 'l',
      name: 'Lemonjello',
      title: '😚',
      manager: 'j',
      img: 'https://www.fillmurray.com/51/51'
    }
  ];

   treeData = {
    const tree = d3
      .stratify()
      .id(d => d.id)
      .parentId(d => d.manager)(flatData);
  
    tree.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
    });
  
    return tree;
  };

  dx = 30

  dy = Math.min(width / (treeData.height + 2), dx * 10)
  svgWidth = Math.max(width, dy * (treeData.height + 1))
  margin = ({ top: 16, right: dy, bottom: 16, left: dy })


chart = {
  // Don't clone it, so changes leak out and we can inspect them
  const root = treeData;
  root.x0 = dy / 2;
  root.y0 = 0;

  const radius = (dx * .9) / 2;

  const svg = d3
    .create("svg")
    .attr("viewBox", [-margin.left, -margin.top, svgWidth, dx])
    .style("font", "12px sans-serif")
    .style("user-select", "none");

  const defs = svg
    .append("defs")
    .append("clipPath")
    .attr("id", "avatar-clip")
    .append("circle")
    .attr("r", radius);

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-opacity", 0.25)
    .attr("stroke-width", 1.5);

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  function update(source, duration = 250) {
    const nodes = root.descendants().reverse();
    const links = root.links();

    // Compute the new tree layout.
    tree(root);

    let left = root;
    let right = root;
    root.eachBefore(node => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + margin.top + margin.bottom;

    const transition = svg
      .transition()
      .duration(duration)
      .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, d => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", d => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("click", d => {
        const toggleOpen = !Boolean(d.children);
        const slow = d3.event && d3.event.altKey;
        const duration = slow ? 2500 : 250;
        if (d3.event && d3.event.shiftKey && d.parent) {
          // Toggle all siblings at this level
          d.parent.children.forEach((node, i) => {
            // TODO extract the data/state/view and use async stuff here?
            setTimeout(() => {
              node.children = toggleOpen ? node._children : null;
              update(node, duration);
            }, duration * i);
          });
        } else {
          d.children = toggleOpen ? d._children : null;
          update(d, duration);
        }
      });

    nodeEnter
      .append("circle")
      .attr("r", radius)
      .attr("fill", "#fff")
      .attr("stroke", d => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 1);

    nodeEnter
      .append("svg:image")
      .attr("xlink:href", function(d) {
        return d.data.img;
      })
      .attr("x", function(d) {
        return -radius;
      })
      .attr("y", function(d) {
        return -radius;
      })
      .attr("height", radius * 2)
      .attr("width", radius * 2)
      .attr("clip-path", "url(#avatar-clip)");

    const labelX = d => (d._children ? -radius * 1.2 : radius * 1.2);

    // Name
    nodeEnter
      .append("text")
      .attr("dy", "-0em")
      .attr("x", labelX)
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white");

    // Title
    nodeEnter
      .append("text")
      .attr("dy", "1em")
      .attr("x", labelX)
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .attr("fill", "#999")
      .style("font", "10px sans-serif")
      .text(d => d.data.title)
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .attr("stroke", "white")
      .append("tspan")
      .attr("dy", "0.3em");

    // Show node's collapsed children count
    // nodeEnter
    //   .append("circle")
    //   .attr("r", 2)
    //   .attr("cx", dx / 2 + 6)
    //   .attr("fill", "none")
    //   .attr("stroke", "#555")
    //   .attr("stroke-width", 1)
    //   .attr('opacity', d => (!d.children && d._children ? 100 : 0));

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", d => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", d => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path").data(links, d => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", d => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link
      .merge(linkEnter)
      .transition(transition)
      .attr("d", diagonal);

    // Transition exiting links to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", d => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore(d => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  update(root);

  return svg.node();
}