// https://observablehq.com/@forresto/collapsible-tree-with-photos@616
import define1 from "./81ee2b72e850ad42@794.js";

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Collapsible Tree with Photos

Click photos to expand or collapse [the tree](/@d3/tidy-tree).

See [flatData](#flatData) for how the tree data is defined.

## Todo

- [x] Photos
- [x] Shift-click to toggle all siblings
- [x] Don't lose state on resize
`
)});
  main.variable(observer("chart")).define("chart", ["treeData","dy","dx","d3","margin","svgWidth","tree","width","diagonal"], function(treeData,dy,dx,d3,margin,svgWidth,tree,width,diagonal)
{
  // Don't clone it, so changes leak out and we can inspect them
  const root = treeData;
  root.x0 = dy / 2;
  root.y0 = 0;

  const radius = (dx * .9) / 2;

  const svg = d3
    .create("svg")
    .attr("viewBox", [-margin.left, -margin.top, svgWidth, dx/2])
    .style("font", "16px sans-serif")
    .style("user-select", "none");

  const defs = svg
    .append("defs")
    .append("clipPath")
    .attr("id", "avatar-clip")
    .append("circle")
    .attr("r", radius*2);

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#0000ff")
    .attr("stroke-opacity", 0.45)
    .attr("stroke-width", 1);

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
      .attr("viewBox", [-margin.left*0.5, left.x - margin.top*4, width, height*4])
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
      .attr("r", radius*2)
      .attr("fill", "#eee")
      .attr("stroke", d => (d._children ? "#0f0" : "#00f"))
      .attr("stroke-width", 2);

    nodeEnter
      .append("svg:image")
      .attr("xlink:href", function(d) {
        return d.data.img;
      })
      .attr("x", function(d) {
        return -radius*2;
      })
      .attr("y", function(d) {
        return -radius*2;
      })
      .attr("height", radius * 4)
      .attr("width", radius * 4)
      .attr("clip-path", "url(#avatar-clip)");

    const labelX = d => (d._children ? -radius * 2.5 : radius * 2.5);

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
      .attr("dy", "1.3em")
      .attr("x", labelX)
      .attr("text-anchor", d => (d._children ? "end" : "start"))
      .attr("fill", "#999")
      .style("font", "12px sans-serif")
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
);
  main.variable(observer("diagonal")).define("diagonal", ["d3"], function(d3){return(
d3.linkHorizontal().x(d => d.y).y(d => d.x)
)});
  main.variable(observer("tree")).define("tree", ["d3","dx","dy"], function(d3,dx,dy){return(
d3.tree().nodeSize([dx*2, dy])
)});
  main.variable(observer("flatData")).define("flatData", function(){return(
[
  {
    id: 'a',
    name: 'Perumal',
    title: 'Paarvathi',
    parent: undefined,
    img: 'https://pbs.twimg.com/profile_images/1235889545549250561/8CXoOLHb_400x400.jpg'
  },
  {
    id: 'b',
    name: 'Govindaraj',
    title: 'Saraswathi',
    parent: 'a',
    img: 'https://www.fillmurray.com/47/47'
  },
  {
    id: 'c',
    name: 'Rajannan',
    title: 'Chennammal',
    parent: 'a',
    img: 'https://www.fillmurray.com/46/45'
  },
  {
    id: 'd',
    name: 'Venugopal',
    title: 'Sampoorani',
    parent: 'a',
    img: 'https://www.fillmurray.com/45/45'
  },
  {
    id: 'e',
    name: 'Gurusamy',
    title: 'Santha',
    parent: 'a',
    img: 'https://www.fillmurray.com/44/44'
  },
  {
    id: 'f',
    name: 'Natarajan',
    title: 'Saraswathi',
    parent: 'a',
    img: 'https://www.fillmurray.com/43/43'
  },
  {
    id: 'g',
    name: 'Krishnaraj',
    title: 'Sivagami',
    parent: 'a',
    img: 'https://www.fillmurray.com/42/42'
  },
  {
    id: 'h',
    name: 'Saraswathi',
    title: 'Nagaraj',
    parent: 'a',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'i',
    name: 'Chandrasekaran',
    title: 'Santha Kumari',
    parent: 'a',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'j',
    name: 'Ramdass',
    title: 'Indrani',
    parent: 'a',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'k',
    name: 'Seethalakshmi',
    title: 'Danakoti',
    parent: 'a',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'ba',
    name: 'Ramachandran',
    title: 'Malliga',
    parent: 'b',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bai',
    name: 'Gokulraj',
    title: 'Shyama',
    parent: 'ba',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'baia',
    name: 'Narotham',
    title: '🧒',
    parent: 'bai',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'baib',
    name: 'Gopal',
    title: '🧒',
    parent: 'bai',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'baii',
    name: 'Chennama',
    title: 'Rajkumar',
    parent: 'ba',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'baiia',
    name: 'Madhav',
    title: '🧒',
    parent: 'baii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bb',
    name: 'Buvaneshwari',
    title: 'Shanmugasundaram',
    parent: 'b',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bbi',
    name: 'Sugavaneshwaran',
    title: 'Jaya',
    parent: 'bb',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'bbia',
    name: 'Devas',
    title: '🧒',
    parent: 'bai',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'bbii',
    name: 'Jagadeeshwaran',
    title: '🧒',
    parent: 'bb',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'bbiii',
    name: 'Nandini',
    title: 'Nagaraj',
    parent: 'bb',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'bc',
    name: 'Selvaraj',
    title: 'Santhi',
    parent: 'b',
    img: 'https://www.fillmurray.com/51/51'
  },{
    id: 'bci',
    name: 'Uma Parvathi',
    title: '',
    parent: 'bc',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bcii',
    name: 'Eshwari',
    title: 'Sivaram',
    parent: 'bc',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'bciia',
    name: 'Lakshana',
    title: '🧒',
    parent: 'bcii',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'bciib',
    name: 'Sanjeev',
    title: '🧒',
    parent: 'bcii',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'bciii',
    name: 'Aishwarya',
    title: 'Harsha',
    parent: 'bc',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'bciiia',
    name: 'Audvik',
    title: '🧒',
    parent: 'bciii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bd',
    name: 'Padmavathi',
    title: 'Rajashekar',
    parent: 'b',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bdi',
    name: 'Vasantha',
    title: 'Nagaraj',
    parent: 'bd',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'bdia',
    name: 'Vijayraj',
    title: 'Priyanka',
    parent: 'bdi',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'bdib',
    name: 'Ganesh Raj',
    title: '🧒',
    parent: 'bdi',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'bdii',
    name: 'Madeshwaran',
    title: 'Jayarani',
    parent: 'bd',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'bdiia',
    name: 'Iyappa',
    title: '🧒',
    parent: 'bdii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bdiib',
    name: 'Yugendra',
    title: '🧒',
    parent: 'bdii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bdiii',
    name: 'Geetha',
    title: 'Badri',
    parent: 'bd',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'bdiiia',
    name: 'Kamali',
    title: '🧒',
    parent: 'bdii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bdiiib',
    name: 'Mukund',
    title: '🧒',
    parent: 'bdii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'be',
    name: 'Kamala',
    title: 'Soundarajan',
    parent: 'b',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'bei',
    name: 'Arun Kumar',
    title: 'Rathna',
    parent: 'bdi',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'beia',
    name: 'Jayanth',
    title: '🧒',
    parent: 'bei',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'beib',
    name: 'Roshan',
    title: '🧒',
    parent: 'bei',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'beii',
    name: 'Anupriya',
    title: 'Krishnaraj',
    parent: 'be',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'beiia',
    name: 'Soundarya',
    title: '👧',
    parent: 'beii',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'beiib',
    name: 'Surya Narayan',
    title: '🧒',
    parent: 'beii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'beiic',
    name: 'Shankar Narayan',
    title: '🧒',
    parent: 'beii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'beiid',
    name: 'Sathya Narayan',
    title: '🧒',
    parent: 'beii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bf',
    name: 'Srinivas Perumal',
    title: 'Geetha',
    parent: 'b',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'bfi',
    name: 'Sowmya',
    title: 'Krishna Karthik',
    parent: 'bf',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'bfii',
    name: 'Vijay Raghavan',
    title: '🧒',
    parent: 'bf',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'bg',
    name: 'Ranganathan',
    title: 'Sudha',
    parent: 'b',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'bgi',
    name: 'Sankkara Narayanan',
    title: '🧒',
    parent: 'bg',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'bgii',
    name: 'Ganesh Krishna',
    title: '🧒',
    parent: 'bg',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'da',
    name: 'Subramanian',
    title: 'Chamundeshwari',
    parent: 'd',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'dai',
    name: 'Venugopal',
    title: 'Soundarya',
    parent: 'da',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'daia',
    name: 'Adarsh Krishnan',
    title: '🧒',
    parent: 'dai',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'daii',
    name: 'Sri Ram',
    title: 'Sasi Madhumitha',
    parent: 'da',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'daiii',
    name: 'Lakshman',
    title: 'Shanthi',
    parent: 'da',
    img: 'https://www.fillmurray.com/51/51'
  },{
    id: 'db',
    name: 'Siddaraj',
    title: 'Leelavathi',
    parent: 'd',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'dbi',
    name: 'Dhanalakshmi',
    title: 'Raja Ramesh',
    parent: 'db',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'dbia',
    name: 'Dhruvan',
    title: '🧒',
    parent: 'dbi',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'dbii',
    name: 'Padmasini',
    title: 'Vasudevan',
    parent: 'db',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'dbiia',
    name: 'Jagshana',
    title: '👧',
    parent: 'dbii',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'dc',
    name: 'Jayalakshmi',
    title: 'Varadharajan',
    parent: 'd',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'dci',
    name: 'Padmanaban',
    title: 'Obulakshmi',
    parent: 'dc',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'dcii',
    name: 'Yuvarani',
    title: 'Karthikeyan',
    parent: 'dc',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'dcia',
    name: 'Tanishka',
    title: '👧',
    parent: 'dci',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'dcib',
    name: 'Harsha',
    title: '🧒',
    parent: 'dci',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'dciia',
    name: 'Loga Soujanya',
    title: '👧',
    parent: 'dcii',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'dciib',
    name: 'Teerth Monish',
    title: '🧒',
    parent: 'dcii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'dd',
    name: 'Saroja',
    title: 'Ramesh Babu',
    parent: 'd',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'ddi',
    name: 'Sujatha',
    title: 'Venugopal',
    parent: 'dd',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'ddia',
    name: 'Shruthi',
    title: '👧',
    parent: 'ddi',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ddib',
    name: 'Sarvesh',
    title: '🧒',
    parent: 'ddi',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ddii',
    name: 'Santhosh',
    title: 'Soundarya',
    parent: 'dd',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ddiia',
    name: 'Sashvan',
    title: '🧒',
    parent: 'ddii',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'de',
    name: 'Venkatraju',
    title: 'Geethalakshmi',
    parent: 'd',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'dei',
    name: 'Vishnupriya',
    title: 'Vinod',
    parent: 'de',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'deii',
    name: 'Vijay Ranjan',
    title: '🧒',
    parent: 'de',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'deia',
    name: 'Kaviya',
    title: '👧',
    parent: 'dei',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'df',
    name: 'Shanmugasundaram',
    title: 'Obulakshmi',
    parent: 'd',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'dfi',
    name: 'Sudharsan',
    title: '🧒',
    parent: 'df',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'dfii',
    name: 'Gowthamnarayanan',
    title: '🧒',
    parent: 'df',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ea',
    name: 'Vijayalakshmi',
    title: 'Rajamanickam',
    parent: 'e',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'eai',
    name: 'Vijayarani',
    title: 'Please Update',
    parent: 'ea',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'eaia',
    name: 'Varshini',
    title: '👧',
    parent: 'eai',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'eaib',
    name: 'Pranav',
    title: '🧒',
    parent: 'eai',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'eaii',
    name: 'Sasirekha',
    title: 'Karthikeyan',
    parent: 'ea',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'eaiia',
    name: 'Divya Dharshini',
    title: '👧',
    parent: 'eaii',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'eaiii',
    name: 'Senthil',
    title: 'Lakshmi Priya',
    parent: 'ea',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'eaiiia',
    name: 'Vishalakshi',
    title: '👧',
    parent: 'eaiii',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'eaiiib',
    name: 'Vignesh',
    title: '🧒',
    parent: 'eaiii',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'eb',
    name: 'Vasanthi',
    title: 'Selvaraj',
    parent: 'e',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'ebi',
    name: 'Karthikeyan',
    title: 'Meghala',
    parent: 'eb',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'ebia',
    name: 'Neharika',
    title: '👧',
    parent: 'ebi',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ebii',
    name: 'Vivekananthan',
    title: 'Bhagyalakshmi',
    parent: 'eb',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ebiia',
    name: 'Lithisha',
    title: '👧',
    parent: 'ebii',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ec',
    name: 'kalyani',
    title: 'Rajagopal',
    parent: 'e',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'eci',
    name: 'Gajalakshmi',
    title: 'Hemath Kumar',
    parent: 'ec',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ecia',
    name: 'Rithika',
    title: '👧',
    parent: 'eci',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ecii',
    name: 'Balakrishna',
    title: 'Saranya',
    parent: 'ec',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'eciia',
    name: 'Dhanush',
    title: '🧒',
    parent: 'ecii',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'ed',
    name: 'Suseela',
    title: 'Suryaprakash',
    parent: 'e',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'edi',
    name: 'Rupasundari',
    title: 'Prasanna Srinivasan',
    parent: 'ed',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'edia',
    name: 'Tanisha',
    title: '👧',
    parent: 'edi',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'edib',
    name: 'Yazhini',
    title: '👧',
    parent: 'edi',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'edii',
    name: 'Karthikeyan',
    title: 'Jayapreethi',
    parent: 'ed',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ee',
    name: 'Ganesh Perumal',
    title: 'Geetha',
    parent: 'e',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'eei',
    name: 'Anutham Perumal',
    title: '🧒',
    parent: 'ee',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'eeii',
    name: 'Aaradhana Perumal',
    title: '👧',
    parent: 'ee',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'fa',
    name: 'Krishnamurthi',
    title: 'Usha Nandhini',
    parent: 'f',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'fai',
    name: 'Bharath (Perumal)',
    title: 'Peroli',
    parent: 'fa',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'faii',
    name: 'Dhanvanthir',
    title: '🧒',
    parent: 'fa',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'fb',
    name: 'Kumar',
    title: 'Punithavathi',
    parent: 'f',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'fbi',
    name: 'Gowripriya',
    title: 'Shivakumar',
    parent: 'fb',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'fbii',
    name: 'Krithika',
    title: '👧',
    parent: 'fb',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'fc',
    name: 'Vasudevan',
    title: 'Sumithra',
    parent: 'f',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'fci',
    name: 'Shrrinivas',
    title: '🧒',
    parent: 'fc',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'fcii',
    name: 'Madhumitha',
    title: '👧',
    parent: 'fc',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'fd',
    name: 'Krishnaveni',
    title: 'Ramu',
    parent: 'f',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'fdi',
    name: 'Karthik(Chendraya)',
    title: 'Geetha',
    parent: 'fd',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'fdia',
    name: 'Narendar',
    title: '🧒',
    parent: 'fdi',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'fe',
    name: 'Venkatesan',
    title: 'Dhanalakshmi',
    parent: 'f',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'fei',
    name: 'Sundar Rajan',
    title: '🧒',
    parent: 'fe',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'feii',
    name: 'Gayathri',
    title: '👧',
    parent: 'fe',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ga',
    name: 'Gopikanandini',
    title: 'Sampath Kumar',
    parent: 'g',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'gai',
    name: 'Shridar',
    title: 'Boomi',
    parent: 'ga',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'gaia',
    name: 'Vishanth',
    title: '🧒',
    parent: 'gai',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'gaii',
    name: 'Parthiban',
    title: 'Aishwarya',
    parent: 'ga',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'gb',
    name: 'Ananthapadmanaban',
    title: 'Manjula',
    parent: 'g',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'gbi',
    name: 'Adithya',
    title: '🧒',
    parent: 'gb',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'gbii',
    name: 'Akash',
    title: '🧒',
    parent: 'gb',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ha',
    name: 'Nagarathnam',
    title: 'Please Update',
    parent: 'h',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'hb',
    name: 'Malliga',
    title: 'Please Update',
    parent: 'h',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'hc',
    name: 'Kandasamy',
    title: 'Please Update',
    parent: 'h',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'hd',
    name: 'Kanchana',
    title: 'Please Update',
    parent: 'h',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'he',
    name: 'Ardhanari',
    title: 'Please Update',
    parent: 'h',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ia',
    name: 'Amsakala',
    title: 'Shanmugasundaram',
    parent: 'i',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'iai',
    name: 'Nirmalraj(Narendar)',
    title: 'Sangeetha',
    parent: 'ia',
    img: 'https://www.fillmurray.com/50/50'
  },
  {
    id: 'iaii',
    name: 'Lokeshwar',
    title: 'Anu',
    parent: 'ia',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'iaia',
    name: 'Vibaknya',
    title: '👧',
    parent: 'iai',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'ib',
    name: 'Sumathi',
    title: 'Shanmugasundaram',
    parent: 'i',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'ibi',
    name: 'Krithika',
    title: 'Karthik Raguram',
    parent: 'ib',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ibia',
    name: 'Lakshaditya',
    title: '🧒',
    parent: 'ibi',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ibii',
    name: 'Priyanka(Paapu)',
    title: '👧',
    parent: 'ib',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'ic',
    name: 'Ramesh Babu',
    title: 'Anuradha',
    parent: 'i',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ici',
    name: 'Rashmitha',
    title: '👧',
    parent: 'ic',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'ja',
    name: 'Muralidharan',
    title: 'Ponmalar',
    parent: 'j',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'jai',
    name: 'Janani',
    title: '👧',
    parent: 'ja',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'jaii',
    name: 'Ishani',
    title: '👧',
    parent: 'ja',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'jb',
    name: 'Suryaprabha',
    title: 'Kumaresan',
    parent: 'j',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'jbi',
    name: 'Gurunaveen',
    title: '🧒',
    parent: 'jb',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'jc',
    name: 'Nirmaladevi',
    title: 'Ram Prasad',
    parent: 'j',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'jci',
    name: 'Lalit Prasad',
    title: '🧒',
    parent: 'jc',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'ka',
    name: 'Prema',
    title: 'Chandrashekar',
    parent: 'k',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'kai',
    name: 'Ananthu',
    title: '🧒',
    parent: 'ka',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'kb',
    name: 'Mahadevan',
    title: 'Viji',
    parent: 'k',
    img: 'https://www.fillmurray.com/51/51'
  },
  {
    id: 'kc',
    name: 'Namashivaya',
    title: 'Pavithra',
    parent: 'k',
    img: 'https://www.fillmurray.com/41/41'
  },
  {
    id: 'kci',
    name: 'Sadasivam',
    title: '🧒',
    parent: 'kc',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'kcii',
    name: 'Thanishka',
    title: '👧',
    parent: 'kc',
    img: 'https://www.fillmurray.com/49/49'
  },
  {
    id: 'kd',
    name: 'Nagasharmila',
    title: 'Madhavaraju',
    parent: 'k',
    img: 'https://www.fillmurray.com/40/40'
  },
  {
    id: 'kdi',
    name: 'Parthasarathi',
    title: '🧒',
    parent: 'kd',
    img: 'https://www.fillmurray.com/49/49'
  }
]
)});
  main.variable(observer()).define(["table","flatData"], function(table,flatData){return(
table(flatData)
)});
  main.define("initial treeData", ["d3","flatData"], function(d3,flatData)
{
  const tree = d3
    .stratify()
    .id(d => d.id)
    .parentId(d => d.parent)(flatData);

  tree.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
  });

  return tree;
}
);
  main.variable(observer("mutable treeData")).define("mutable treeData", ["Mutable", "initial treeData"], (M, _) => new M(_));
  main.variable(observer("treeData")).define("treeData", ["mutable treeData"], _ => _.generator);
  main.variable(observer("dx")).define("dx", function(){return(
30
)});
  main.variable(observer("dy")).define("dy", ["width","treeData","dx"], function(width,treeData,dx){return(
Math.min(width / (treeData.height + 2), dx * 10)
)});
  main.variable(observer("svgWidth")).define("svgWidth", ["width","dy","treeData"], function(width,dy,treeData){return(
Math.max(width, dy * (treeData.height + 1))
)});
  main.variable(observer("margin")).define("margin", ["dy"], function(dy){return(
{ top: 16, right: dy, bottom: 16, left: dy }
)});
  main.variable(observer()).define(["md"], function(md){return(
md`# Libs`
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  const child1 = runtime.module(define1);
  main.import("table", child1);
  return main;
}
