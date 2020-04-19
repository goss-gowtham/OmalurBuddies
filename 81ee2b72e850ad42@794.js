// https://observablehq.com/@forresto/table@794
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Table

Tabular data (\`Array<Record>\`) to html (\`<table>\`).

## Todo

Fork me to make a _spreadsheet_ some day...

- [ ] type hints for editing
- [ ] basic editing
  - [ ] "edit cell"
  - [ ] "edit row"

## Use

\`data\` is assumed to be an array of objects, with each object having the same shape.

\`\`\`js
import {table} from '@forresto/table'
table(demoData)
demoData = [
  {tag: 'One', occurences: 1, color: 'rgb(110, 64, 170)'}, 
  {tag: 'Two', occurences: 2, color: 'rgb(175, 240, 91)'},
  {tag: 'Three', occurences: 2, color: 'rgb(255, 94, 99)'},
  {tag: 'Four', occurences: 4, color: 'rgb(26, 199, 194)'},
]
\`\`\`
`
)});
  main.variable(observer("data")).define("data", ["table","demoData"], function(table,demoData){return(
table(demoData)
)});
  main.variable(observer("demoData")).define("demoData", function(){return(
[
  { tag: 'One', occurences: 1, color: 'rgb(110, 64, 170)' },
  { tag: 'Two', occurences: 2, color: 'rgb(175, 240, 91)' },
  { tag: 'Three', occurences: 2, color: 'rgb(255, 94, 99)' },
  { tag: 'Four', occurences: 4, color: 'rgb(26, 199, 194)' }
]
)});
  main.variable(observer("table")).define("table", ["html"], function(html){return(
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
}
)});
  main.variable(observer("graph")).define("graph", ["html"], function(html){return(
html `<div></div>`
)});
  return main;
}
