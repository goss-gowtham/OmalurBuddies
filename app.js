// https://observablehq.com/@forresto/collapsible-tree-with-photos@616

export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Omalur Family Tree - Collapsible
`
)});
  main.variable(observer("chart")).define("chart", ["treeData","dy","dx","d3","margin","svgWidth","tree","width","diagonal"], function(treeData,dy,dx,d3,margin,svgWidth,tree,width,diagonal)
{

  const root = treeData;
  root.x0 = dy / 2;
  root.y0 = 0;
  

  const radius = (dx * .9) / 2;
  const svg = d3
    .create("svg")
    .attr("viewBox", [-margin.left, -margin.top, width, dx])
    .style("font", "20px sans-serif")
    .style("user-select", "none");
  console.log("This site is developed by Gowthamnarayanan S")

  const defs = svg
    .append("defs")
    .append("clipPath")
    .attr("id", "avatar-clip")
    .append("circle")
    .attr("r", radius*2);

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#0f0")
    .attr("stroke-opacity", 0.85)
    .attr("stroke-width", 2);

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");
    // Collapse after the second level
    root.children.forEach(collapse);

    update(root);

    // Collapse the node and all it's children
    function collapse(d) {
      if(d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

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

    const height = right.x - left.x + margin.top + margin.bottom + 80;

    const transition = svg
      .transition()
      .duration(duration)
      .attr("viewBox", [-margin.left*0.9, left.x - margin.top*4, width, height*1.05])
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
      .attr("fill", "#eefcd2")
      .attr("stroke", d => (d._children ? "#0f0" : "#00f"))
      .attr("stroke-width", 3);

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

    const labelX = radius/2;

    // Name
    nodeEnter
      .append("text")
      .attr("dy", "3em")
      .attr("x", labelX)
      .attr("text-anchor","middle")
      .text(d => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 0)
      .attr("stroke", "white");

    // Title
    nodeEnter
      .append("text")
      .attr("dy", "5em")
      .attr("x", labelX)
      .attr("text-anchor", "middle")
      .attr("fill", "#999")
      .style("font", "16px sans-serif")
      .text(d => d.data.title)
      .clone(true)
      .lower()
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 1)
      .attr("stroke", "#eee")
      .append("tspan")
      .attr("dy", "0.3em");

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
d3.tree().nodeSize([dx*4, dy])
)});
  main.variable(observer("flatData")).define("flatData", function(){return(
[
  {
    id: 'a',
    name: 'Perumal',
    title: 'Paarvathi',
    parent: undefined,
    img: ''
  },
  {
    id: 'b',
    name: 'Govindaraj',
    title: 'Saraswathi',
    parent: 'a',
    img: ''
  },
  {
    id: 'c',
    name: 'Rajannan',
    title: 'Chennammal',
    parent: 'a',
    img: ''
  },
  {
    id: 'd',
    name: 'Venugopal',
    title: 'Sampoorani',
    parent: 'a',
    img: './images/Venugopal/Venugopal.jpg'
  },
  {
    id: 'e',
    name: 'Gurusamy',
    title: 'Santha',
    parent: 'a',
    img: './images/Gurusamy/Gurusamy.jpg'
  },
  {
    id: 'f',
    name: 'Natarajan',
    title: 'Saraswathi',
    parent: 'a',
    img: ''
  },
  {
    id: 'g',
    name: 'Krishnaraj',
    title: 'Sivagami',
    parent: 'a',
    img: ''
  },
  {
    id: 'h',
    name: 'Saraswathi',
    title: 'Nagaraj',
    parent: 'a',
    img: ''
  },
  {
    id: 'i',
    name: 'Chandrasekaran',
    title: 'Santha Kumari',
    parent: 'a',
    img: ''
  },
  {
    id: 'j',
    name: 'Ramdass',
    title: 'Indrani',
    parent: 'a',
    img: './images/Ramdass/Ramdass.jpg'
  },
  {
    id: 'k',
    name: 'Seethalakshmi',
    title: 'Danakoti',
    parent: 'a',
    img: ''
  },
  {
    id: 'ba',
    name: 'Ramachandran',
    title: 'Malliga',
    parent: 'b',
    img: './images/Govindaraju/Ramji.jpg'
  },
  {
    id: 'bai',
    name: 'Gokulraj',
    title: 'Shyama',
    parent: 'ba',
    img: ''
  },
  {
    id: 'baia',
    name: 'Narotham',
    title: '👨',
    parent: 'bai',
    img: ''
  },
  {
    id: 'baib',
    name: 'Gopal',
    title: '👨',
    parent: 'bai',
    img: ''
  },
  {
    id: 'baii',
    name: 'Chennama',
    title: 'Rajkumar',
    parent: 'ba',
    img: './images/Govindaraju/Chenni.jpg'
  },
  {
    id: 'baiia',
    name: 'Madhav',
    title: '👨',
    parent: 'baii',
    img: './images/Govindaraju/Madhav.jpg'
  },
  {
    id: 'bb',
    name: 'Buvaneshwari',
    title: 'Shanmugasundaram',
    parent: 'b',
    img: ''
  },
  {
    id: 'bbi',
    name: 'Sugavaneshwaran',
    title: 'Jaya',
    parent: 'bb',
    img: ''
  },
  {
    id: 'bbia',
    name: 'Devas',
    title: '👨',
    parent: 'bbi',
    img: ''
  },
  {
    id: 'bbii',
    name: 'Jagadeeshwaran',
    title: '👨',
    parent: 'bb',
    img: ''
  },
  {
    id: 'bbiii',
    name: 'Nandini',
    title: 'Nagaraj',
    parent: 'bb',
    img: ''
  },
  {
    id: 'bc',
    name: 'Selvaraj',
    title: 'Santhi',
    parent: 'b',
    img: ''
  },{
    id: 'bci',
    name: 'Uma Parvathi',
    title: '',
    parent: 'bc',
    img: ''
  },
  {
    id: 'bcii',
    name: 'Eshwari',
    title: 'Sivaram',
    parent: 'bc',
    img: ''
  },
  {
    id: 'bciia',
    name: 'Lakshana',
    title: '👨',
    parent: 'bcii',
    img: ''
  },
  {
    id: 'bciib',
    name: 'Sanjeev',
    title: '👨',
    parent: 'bcii',
    img: ''
  },
  {
    id: 'bciii',
    name: 'Aishwarya',
    title: 'Harsha',
    parent: 'bc',
    img: ''
  },
  {
    id: 'bciiia',
    name: 'Audvik',
    title: '👨',
    parent: 'bciii',
    img: ''
  },
  {
    id: 'bd',
    name: 'Padmavathi',
    title: 'Rajashekar',
    parent: 'b',
    img: ''
  },
  {
    id: 'bdi',
    name: 'Vasantha',
    title: 'Nagaraj',
    parent: 'bd',
    img: ''
  },
  {
    id: 'bdia',
    name: 'Vijayraj',
    title: 'Priyanka',
    parent: 'bdi',
    img: ''
  },
  {
    id: 'bdib',
    name: 'Ganesh Raj',
    title: '👨',
    parent: 'bdi',
    img: ''
  },
  {
    id: 'bdii',
    name: 'Madeshwaran',
    title: 'Jayarani',
    parent: 'bd',
    img: ''
  },
  {
    id: 'bdiia',
    name: 'Iyappa',
    title: '👨',
    parent: 'bdii',
    img: ''
  },
  {
    id: 'bdiib',
    name: 'Yugendra',
    title: '👨',
    parent: 'bdii',
    img: ''
  },
  {
    id: 'bdiii',
    name: 'Geetha',
    title: 'Badri',
    parent: 'bd',
    img: ''
  },
  {
    id: 'bdiiia',
    name: 'Kamali',
    title: '👨',
    parent: 'bdiii',
    img: ''
  },
  {
    id: 'bdiiib',
    name: 'Mukund',
    title: '👨',
    parent: 'bdiii',
    img: ''
  },
  {
    id: 'be',
    name: 'Kamala',
    title: 'Soundarajan',
    parent: 'b',
    img: ''
  },
  {
    id: 'bei',
    name: 'Arun Kumar',
    title: 'Rathna',
    parent: 'be',
    img: ''
  },
  {
    id: 'beia',
    name: 'Jayanth',
    title: '👨',
    parent: 'bei',
    img: ''
  },
  {
    id: 'beib',
    name: 'Roshan',
    title: '👨',
    parent: 'bei',
    img: ''
  },
  {
    id: 'beii',
    name: 'Anupriya',
    title: 'Krishnaraj',
    parent: 'be',
    img: ''
  },
  {
    id: 'beiia',
    name: 'Soundarya',
    title: '👧',
    parent: 'beii',
    img: ''
  },
  {
    id: 'beiib',
    name: 'Surya Narayan',
    title: '👨',
    parent: 'beii',
    img: ''
  },
  {
    id: 'beiic',
    name: 'Shankar Narayan',
    title: '👨',
    parent: 'beii',
    img: ''
  },
  {
    id: 'beiid',
    name: 'Sathya Narayan',
    title: '👨',
    parent: 'beii',
    img: ''
  },
  {
    id: 'bf',
    name: 'Srinivas Perumal',
    title: 'Geetha',
    parent: 'b',
    img: ''
  },
  {
    id: 'bfi',
    name: 'Sowmya',
    title: 'Krishna Karthik',
    parent: 'bf',
    img: ''
  },
  {
    id: 'bfii',
    name: 'Vijay Raghavan',
    title: '👨',
    parent: 'bf',
    img: ''
  },
  {
    id: 'bg',
    name: 'Ranganathan',
    title: 'Sudha',
    parent: 'b',
    img: ''
  },
  {
    id: 'bgi',
    name: 'Sankkara Narayanan',
    title: '👨',
    parent: 'bg',
    img: './images/Govindaraju/Sankar.jpg'
  },
  {
    id: 'bgii',
    name: 'Ganesh Krishna',
    title: '👨',
    parent: 'bg',
    img: ''
  },
  {
    id: 'da',
    name: 'Subramanian',
    title: 'Chamundeshwari',
    parent: 'd',
    img: ''
  },
  {
    id: 'dai',
    name: 'Venugopal',
    title: 'Soundarya',
    parent: 'da',
    img: ''
  },
  {
    id: 'daia',
    name: 'Adarsh Krishnan',
    title: '👨',
    parent: 'dai',
    img: './images/Venugopal/Adarsh.jpg'
  },
  {
    id: 'daii',
    name: 'Sri Ram',
    title: 'Sasi Madhumitha',
    parent: 'da',
    img: ''
  },
  {
    id: 'daiia',
    name: 'Nakshatra',
    title: '👧',
    parent: 'daii',
    img: ''
  },
  {
    id: 'daiii',
    name: 'Lakshman',
    title: 'Shanthi',
    parent: 'da',
    img: ''
  },{
    id: 'db',
    name: 'Siddaraj',
    title: 'Leelavathi',
    parent: 'd',
    img: ''
  },
  {
    id: 'dbi',
    name: 'Dhanalakshmi',
    title: 'Raja Ramesh',
    parent: 'db',
    img: ''
  },
  {
    id: 'dbia',
    name: 'Dhruvan',
    title: '👨',
    parent: 'dbi',
    img: ''
  },
  {
    id: 'dbii',
    name: 'Padmasini',
    title: 'Vasudevan',
    parent: 'db',
    img: ''
  },
  {
    id: 'dbiia',
    name: 'Jagshana',
    title: '👧',
    parent: 'dbii',
    img: ''
  },
  {
    id: 'dc',
    name: 'Jayalakshmi',
    title: 'Varadharajan',
    parent: 'd',
    img: ''
  },
  {
    id: 'dci',
    name: 'Padmanaban',
    title: 'Obulakshmi',
    parent: 'dc',
    img: './images/Venugopal/Padmanaban.jpg'
  },
  {
    id: 'dcii',
    name: 'Yuvarani',
    title: 'Karthikeyan',
    parent: 'dc',
    img: ''
  },
  {
    id: 'dcia',
    name: 'Tanishka',
    title: '👧',
    parent: 'dci',
    img: './images/Venugopal/Tanishka.jpg'
  },
  {
    id: 'dcib',
    name: 'Harsha',
    title: '👨',
    parent: 'dci',
    img: './images/Venugopal/Harsha.jpg'
  },
  {
    id: 'dciia',
    name: 'Loga Soujanya',
    title: '👧',
    parent: 'dcii',
    img: ''
  },
  {
    id: 'dciib',
    name: 'Teerth Monish',
    title: '👨',
    parent: 'dcii',
    img: ''
  },
  {
    id: 'dd',
    name: 'Saroja',
    title: 'Ramesh Babu',
    parent: 'd',
    img: ''
  },
  {
    id: 'ddi',
    name: 'Sujatha',
    title: 'Venugopal',
    parent: 'dd',
    img: ''
  },
  {
    id: 'ddia',
    name: 'Shruthi',
    title: '👧',
    parent: 'ddi',
    img: ''
  },
  {
    id: 'ddib',
    name: 'Sarvesh',
    title: '👨',
    parent: 'ddi',
    img: ''
  },
  {
    id: 'ddii',
    name: 'Santhosh',
    title: 'Soundarya',
    parent: 'dd',
    img: ''
  },
  {
    id: 'ddiia',
    name: 'Sashvan',
    title: '👨',
    parent: 'ddii',
    img: ''
  },
  {
    id: 'de',
    name: 'Venkatraju',
    title: 'Geethalakshmi',
    parent: 'd',
    img: ''
  },
  {
    id: 'dei',
    name: 'Vishnupriya',
    title: 'Vinod',
    parent: 'de',
    img: ''
  },
  {
    id: 'deii',
    name: 'Vijay Ranjan',
    title: '👨',
    parent: 'de',
    img: ''
  },
  {
    id: 'deia',
    name: 'Kaviya',
    title: '👧',
    parent: 'dei',
    img: ''
  },
  {
    id: 'df',
    name: 'Shanmugasundaram',
    title: 'Obulakshmi',
    parent: 'd',
    img: './images/Venugopal/Sundar.jpg'
  },
  {
    id: 'dfi',
    name: 'Sudharsan',
    title: '👨',
    parent: 'df',
    img: './images/Venugopal/Sudharsan.jpg'
  },
  {
    id: 'dfii',
    name: 'Gowthamnarayanan',
    title: '👨',
    parent: 'df',
    img: './images/Venugopal/Gowthamnarayanan.jpg'
  },
  {
    id: 'ea',
    name: 'Vijayalakshmi',
    title: 'Rajamanickam',
    parent: 'e',
    img: './images/Gurusamy/vijaya.jpg'
  },
  {
    id: 'eai',
    name: 'Vijayarani',
    title: 'Udhay Shankar',
    parent: 'ea',
    img: './images/Gurusamy/rani.jpg'
  },
  {
    id: 'eaia',
    name: 'Nithya Varshini',
    title: '👧',
    parent: 'eai',
    img: './images/Gurusamy/varshini.jpg'
  },
  {
    id: 'eaib',
    name: 'Pranav',
    title: '👨',
    parent: 'eai',
    img: './images/Gurusamy/pranav.jpg'
  },
  {
    id: 'eaii',
    name: 'Sasirekha',
    title: 'Karthikeyan',
    parent: 'ea',
    img: './images/Gurusamy/sasi.jpg'
  },
  {
    id: 'eaiia',
    name: 'Divya Dharshini',
    title: '👧',
    parent: 'eaii',
    img: './images/Gurusamy/divyadharshini.jpg'
  },
  {
    id: 'eaiii',
    name: 'Senthil',
    title: 'Lakshmi Priya',
    parent: 'ea',
    img: './images/Gurusamy/senthil.jpg'
  },
  {
    id: 'eaiiia',
    name: 'Vishalakshi',
    title: '👧',
    parent: 'eaiii',
    img: ''
  },
  {
    id: 'eaiiib',
    name: 'Vignesh',
    title: '👨',
    parent: 'eaiii',
    img: './images/Gurusamy/Vignesh.jpg'
  },
  {
    id: 'eb',
    name: 'Vasanthi',
    title: 'Selvaraj',
    parent: 'e',
    img: ''
  },
  {
    id: 'ebi',
    name: 'Karthikeyan',
    title: 'Meghala',
    parent: 'eb',
    img: ''
  },
  {
    id: 'ebia',
    name: 'Neharika',
    title: '👧',
    parent: 'ebi',
    img: ''
  },
  {
    id: 'ebii',
    name: 'Vivekananthan',
    title: 'Bhagyalakshmi',
    parent: 'eb',
    img: ''
  },
  {
    id: 'ebiia',
    name: 'Lithisha',
    title: '👧',
    parent: 'ebii',
    img: ''
  },
  {
    id: 'ec',
    name: 'Kalyani',
    title: 'Rajagopal',
    parent: 'e',
    img: './images/Gurusamy/Kalyani.jpg'
  },
  {
    id: 'eci',
    name: 'Gajalakshmi',
    title: 'Hemath Kumar',
    parent: 'ec',
    img: './images/Gurusamy/Gajalakshmi.jpg'
  },
  {
    id: 'ecia',
    name: 'Rithika',
    title: '👧',
    parent: 'eci',
    img: './images/Gurusamy/Rithika.jpg'
  },
  {
    id: 'ecib',
    name: 'Nakul Kruthik',
    title: '',
    parent: 'eci',
    img: './images/Gurusamy/Nakul.jpg'
  },
  {
    id: 'ecii',
    name: 'Balakrishna',
    title: 'Saranya',
    parent: 'ec',
    img: './images/Gurusamy/balakrishnan.jpg'
  },
  {
    id: 'eciia',
    name: 'Dhanush',
    title: '👨',
    parent: 'ecii',
    img: './images/Gurusamy/Dhanush.jpg'
  },
  {
    id: 'ed',
    name: 'Suseela',
    title: 'Suryaprakash',
    parent: 'e',
    img: ''
  },
  {
    id: 'edi',
    name: 'Rupasundari',
    title: 'Prasanna Srinivasan',
    parent: 'ed',
    img: ''
  },
  {
    id: 'edia',
    name: 'Tanisha',
    title: '👧',
    parent: 'edi',
    img: ''
  },
  {
    id: 'edib',
    name: 'Yazhini',
    title: '👧',
    parent: 'edi',
    img: ''
  },
  {
    id: 'edii',
    name: 'Karthikeyan',
    title: 'Jayapreethi',
    parent: 'ed',
    img: ''
  },
  {
    id: 'ee',
    name: 'Ganesh Perumal',
    title: 'Geetha',
    parent: 'e',
    img: './images/Gurusamy/Ganesh.jpg'
  },
  {
    id: 'eei',
    name: 'Anutham Perumal',
    title: '👨',
    parent: 'ee',
    img: './images/Gurusamy/Anuttam.jpg'
  },
  {
    id: 'eeii',
    name: 'Aaradhana Perumal',
    title: '👧',
    parent: 'ee',
    img: './images/Govindaraju/Aara.jpeg'
  },
  {
    id: 'fa',
    name: 'Krishnamurthi',
    title: 'Usha Nandhini',
    parent: 'f',
    img: ''
  },
  {
    id: 'fai',
    name: 'Bharath (Perumal)',
    title: 'Peroli',
    parent: 'fa',
    img: ''
  },
  {
    id: 'faii',
    name: 'Dhanvanthir',
    title: '👨',
    parent: 'fa',
    img: ''
  },
  {
    id: 'fb',
    name: 'Kumar',
    title: 'Punithavathi',
    parent: 'f',
    img: ''
  },
  {
    id: 'fbi',
    name: 'Gowripriya',
    title: 'Shivakumar',
    parent: 'fb',
    img: ''
  },
  {
    id: 'fbii',
    name: 'Krithika',
    title: '👧',
    parent: 'fb',
    img: ''
  },
  {
    id: 'fc',
    name: 'Vasudevan',
    title: 'Sumithra',
    parent: 'f',
    img: ''
  },
  {
    id: 'fci',
    name: 'Shrrinivas',
    title: '👨',
    parent: 'fc',
    img: './images/Nataraj/Srinivasan.jpg'
  },
  {
    id: 'fcii',
    name: 'Madhumitha',
    title: '👧',
    parent: 'fc',
    img: './images/Nataraj/Madhumitha.jpg'
  },
  {
    id: 'fd',
    name: 'Krishnaveni',
    title: 'Ramu',
    parent: 'f',
    img: ''
  },
  {
    id: 'fdi',
    name: 'Karthik(Chendraya)',
    title: 'Geetha',
    parent: 'fd',
    img: ''
  },
  {
    id: 'fdia',
    name: 'Narendar',
    title: '👨',
    parent: 'fdi',
    img: ''
  },
  {
    id: 'fe',
    name: 'Venkatesan',
    title: 'Dhanalakshmi',
    parent: 'f',
    img: ''
  },
  {
    id: 'fei',
    name: 'Sundar Rajan',
    title: '👨',
    parent: 'fe',
    img: './images/Nataraj/Sundar.jpg'
  },
  {
    id: 'feii',
    name: 'Gayathri',
    title: '👧',
    parent: 'fe',
    img: ''
  },
  {
    id: 'ga',
    name: 'Gopikanandini',
    title: 'Sampath Kumar',
    parent: 'g',
    img: ''
  },
  {
    id: 'gai',
    name: 'Shridar',
    title: 'Boomi',
    parent: 'ga',
    img: ''
  },
  {
    id: 'gaia',
    name: 'Vishanth',
    title: '👨',
    parent: 'gai',
    img: ''
  },
  {
    id: 'gaii',
    name: 'Parthiban',
    title: 'Aishwarya',
    parent: 'ga',
    img: ''
  },
  {
    id: 'gb',
    name: 'Ananthapadmanaban',
    title: 'Manjula',
    parent: 'g',
    img: ''
  },
  {
    id: 'gbi',
    name: 'Adithya',
    title: '👨',
    parent: 'gb',
    img: ''
  },
  {
    id: 'gbii',
    name: 'Akash',
    title: '👨',
    parent: 'gb',
    img: ''
  },
  {
    id: 'ha',
    name: 'Nagarathnam',
    title: 'Kanchana',
    parent: 'h',
    img: ''
  },
  {
    id: 'hb',
    name: 'Malliga',
    title: 'Selvaraju',
    parent: 'h',
    img: ''
  },
  {
    id: 'hc',
    name: 'Kandasamy',
    title: 'Parvathy',
    parent: 'h',
    img: ''
  },
  {
    id: 'hd',
    name: 'Kanchana',
    title: 'Shanmugam',
    parent: 'h',
    img: ''
  },
  {
    id: 'he',
    name: 'Ardhanari',
    title: 'Please Update',
    parent: 'h',
    img: ''
  },
  {
    id: 'ia',
    name: 'Amsakala',
    title: 'Shanmugasundaram',
    parent: 'i',
    img: ''
  },
  {
    id: 'iai',
    name: 'Nirmalraj(Narendar)',
    title: 'Sangeetha',
    parent: 'ia',
    img: ''
  },
  {
    id: 'iaii',
    name: 'Lokeshwar',
    title: 'Anu',
    parent: 'ia',
    img: './images/Sekar/Lokesh.jpg'
  },
  {
    id: 'iaia',
    name: 'Vibaknya',
    title: '👧',
    parent: 'iai',
    img: './images/Sekar/Vibaknya.jpg'
  },
  {
    id: 'ib',
    name: 'Sumathi',
    title: 'Shanmugasundaram',
    parent: 'i',
    img: './images/Sekar/Sumathi.jpg'
  },
  {
    id: 'ibi',
    name: 'Kirthika',
    title: 'Karthik Raguram',
    parent: 'ib',
    img: './images/Sekar/Kirthika.jpg'
  },
  {
    id: 'ibia',
    name: 'Lakshaditya',
    title: '👨',
    parent: 'ibi',
    img: './images/Sekar/Lakshaditya.jpg'
  },
  {
    id: 'ibii',
    name: 'Priyanka(Paapu)',
    title: '👧',
    parent: 'ib',
    img: './images/Sekar/Paapu.jpg'
  },
  {
    id: 'ic',
    name: 'Ramesh Babu',
    title: 'Anuradha',
    parent: 'i',
    img: ''
  },
  {
    id: 'ici',
    name: 'Rashmitha',
    title: '👧',
    parent: 'ic',
    img: ''
  },
  {
    id: 'ja',
    name: 'Muralidharan',
    title: 'Ponmalar',
    parent: 'j',
    img: './images/Ramdass/Murali.jpg'
  },
  {
    id: 'jai',
    name: 'Janani',
    title: '👧',
    parent: 'ja',
    img: './images/Ramdass/Janani.jpg'
  },
  {
    id: 'jaii',
    name: 'Ishani',
    title: '👧',
    parent: 'ja',
    img: './images/Ramdass/Ishani.jpg'
  },
  {
    id: 'jb',
    name: 'Suryaprabha',
    title: 'Kumaresan',
    parent: 'j',
    img: './images/Ramdass/churi.jpg'
  },
  {
    id: 'jbi',
    name: 'Gurunaveen',
    title: '👨',
    parent: 'jb',
    img: './images/Ramdass/gurunaveen.jpg'
  },
  {
    id: 'jc',
    name: 'Nirmaladevi',
    title: 'Ram Prasath',
    parent: 'j',
    img: './images/Ramdass/nimmi.jpg'
  },
  {
    id: 'jci',
    name: 'Lallit Prasath',
    title: '👨',
    parent: 'jc',
    img: './images/Ramdass/lallith.jpg'
  },
  {
    id: 'ka',
    name: 'Prema',
    title: 'Chandrashekar',
    parent: 'k',
    img: ''
  },
  {
    id: 'kai',
    name: 'Ananthu',
    title: '👨',
    parent: 'ka',
    img: ''
  },
  {
    id: 'kb',
    name: 'Mahadevan',
    title: 'Viji',
    parent: 'k',
    img: ''
  },
  {
    id: 'kc',
    name: 'Namashivaya',
    title: 'Pavithra',
    parent: 'k',
    img: ''
  },
  {
    id: 'kci',
    name: 'Sadasivam',
    title: '👨',
    parent: 'kc',
    img: ''
  },
  {
    id: 'kcii',
    name: 'Thanishka',
    title: '👧',
    parent: 'kc',
    img: ''
  },
  {
    id: 'kd',
    name: 'Nagasharmila',
    title: 'Madhavaraju',
    parent: 'k',
    img: ''
  },
  {
    id: 'kdi',
    name: 'Parthasarathi',
    title: '👨',
    parent: 'kd',
    img: ''
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
  main.variable(observer("dx")).define("dx", function(){return(42)});
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
  return main;
}
