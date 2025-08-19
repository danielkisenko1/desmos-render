#!/usr/bin/env node
// cli-grapher.js - ASCII graphing with colors, zoom, pan, evaluation, and annotations

const { create, all } = require('mathjs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const math = create(all, { matrix: 'Array' });

// ---------------- CLI ----------------
const argv = yargs(hideBin(process.argv))
  .usage('$0 -e "<expr>" [-e "<expr2>"] [options]')
  .option('e', {
    alias: 'expr',
    array: true,
    description: 'Expression(s) to plot (explicit y=f(x) or implicit F(x,y)=0)',
    demandOption: true,
    type: 'string'
  })
  .option('width',  { default: 90,  type: 'number', desc: 'Canvas width (chars)' })
  .option('height', { default: 30,  type: 'number', desc: 'Canvas height (rows)' })
  .option('xmin',   { default: -10, type: 'number', desc: 'Min x' })
  .option('xmax',   { default: 10, type: 'number', desc: 'Max x' })
  .option('ymin',   { default: -5,  type: 'number', desc: 'Min y' })
  .option('ymax',   { default: 5,  type: 'number', desc: 'Max y' })
  .option('zoom',   { default: 1, type: 'number', desc: 'Zoom factor (>1 zooms in)' })
  .option('panx',   { default: 0, type: 'number', desc: 'Pan x direction' })
  .option('pany',   { default: 0, type: 'number', desc: 'Pan y direction' })
  .option('ticks',  { default: true, type: 'boolean', desc: 'Show axis ticks' })
  .option('chars',  { default: '*+ox#%@', type: 'string', desc: 'Marker chars used per expression' })
  .option('eval',   { type: 'string', array: true, desc: 'Expression(s) to evaluate at point(s)' })
  .option('x',      { type: 'number', array: true, desc: 'x value(s) for evaluation' })
  .option('y',      { type: 'number', array: true, desc: 'y value(s) for evaluation (optional)' })
  .option('t',      { type: 'number', array: true, desc: 't value(s) for parametric evaluation' })
  .option('mark',   { type: 'boolean', array: true, desc: 'Mark evaluated point(s) on graph' })
  .option('markchar',{ type: 'string', default: '@', desc: 'Character for marked point' })
  .option('label',  { type: 'string', array: true, desc: 'Label for evaluated point(s)' })
  .option('labeloffset',{ type:'number', default:2, desc:'Horizontal offset for label'} )
  .help()
  .argv;

// ---------------- Helpers ----------------
const W = Math.max(10, argv.width|0);
const H = Math.max(5,  argv.height|0);

let XMIN = argv.xmin, XMAX = argv.xmax, YMIN = argv.ymin, YMAX = argv.ymax;
const XR = XMAX - XMIN, YR = YMAX - YMIN;

if (!(XR > 0 && YR > 0)) {
  console.error('Viewport must have xmax>xmin and ymax>ymin.');
  process.exit(1);
}

// Apply zoom & pan
const zoom = argv.zoom>0 ? argv.zoom:1;
const xMid = (XMIN+XMAX)/2;
const yMid = (YMIN+YMAX)/2;
const xHalf = XR/(2*zoom);
const yHalf = YR/(2*zoom);
XMIN = xMid - xHalf + argv.panx;
XMAX = xMid + xHalf + argv.panx;
YMIN = yMid - yHalf + argv.pany;
YMAX = yMid + yHalf + argv.pany;

const chars = argv.chars.split('');
const COLORS = ['\x1b[31m','\x1b[32m','\x1b[34m','\x1b[35m','\x1b[36m','\x1b[33m'];
const RESET = '\x1b[0m';
const annotations = [];

function inRange(v){ return Number.isFinite(v) && !Number.isNaN(v); }
function xAtCol(c){ return XMIN + (c/(W-1))* (XMAX-XMIN); }
function yAtRow(r){ return YMAX - (r/(H-1))* (YMAX-YMIN); }
function colAtX(x){ return Math.round((x - XMIN)/(XMAX-XMIN)*(W-1)); }
function rowAtY(y){ return Math.round((YMAX - y)/(YMAX-YMIN)*(H-1)); }

function makeCanvas(){
  const rows=[];
  for(let r=0;r<H;r++) rows.push(new Array(W).fill(' '));
  return rows;
}

function niceTick(rough){
  const p = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough/p;
  if(n<=1.5) return 1*p;
  if(n<=3)   return 2*p;
  if(n<=7)   return 5*p;
  return 10*p;
}

// Draw axes
function drawAxes(grid){
  // y=0
  if(YMIN<0 && YMAX>0){
    const r0=rowAtY(0);
    if(r0>=0 && r0<H){
      for(let c=0;c<W;c++) grid[r0][c] = grid[r0][c]==='|' ? '+' : (grid[r0][c]==='+'?'+':'-');
    }
  }
  // x=0
  if(XMIN<0 && XMAX>0){
    const c0=colAtX(0);
    if(c0>=0 && c0<W){
      for(let r=0;r<H;r++) grid[r][c0] = grid[r][c0]==='-'?'+':(grid[r][c0]==='+'?'+':'|');
    }
  }
  if(argv.ticks){
    const tickEvery = niceTick(Math.min(XMAX-XMIN,YMAX-YMIN)/10);
    if(YMIN<0 && YMAX>0){
      const r0 = rowAtY(0);
      for(let xt=Math.ceil(XMIN/tickEvery)*tickEvery; xt<=XMAX; xt+=tickEvery){
        const c = colAtX(xt); if(r0>=0 && r0<H && c>=0 && c<W) grid[r0][c]='+';
      }
    }
    if(XMIN<0 && XMAX>0){
      const c0 = colAtX(0);
      for(let yt=Math.ceil(YMIN/tickEvery)*tickEvery; yt<=YMAX; yt+=tickEvery){
        const r = rowAtY(yt); if(r>=0 && r<H && c0>=0 && c0<W) grid[r][c0]='+';
      }
    }
  }
}

// Compile expression
function compileExpr(str){
  const cleaned = str.replace(/\s+/g,'').replace(/^y=/i,'');
  const node = math.parse(cleaned);
  const vars = node.filter(n=>n.isSymbolNode).map(n=>n.name);
  const usesY = vars.includes('y');
  const f = node.compile();
  return { raw:str, cleaned, usesY, eval:(scope)=>f.evaluate(scope) };
}

// Explicit plot (oversampled)
function plotExplicit(grid, fn, mark){
  const oversample = 8;
  const step = (XMAX - XMIN)/(W*oversample);
  for(let i=0;i<W*oversample;i++){
    const x = XMIN + i*step;
    let y;
    try{ y = fn({x,y:0}); } catch{ y=NaN; }
    if(!inRange(y)) continue;
    const c = colAtX(x);
    const r = rowAtY(y);
    if(r>=0 && r<H && c>=0 && c<W) grid[r][c]=mark;
  }
}

// Implicit plot
function plotImplicit(grid, fn, mark){
  const eps = 0.02*Math.min(XMAX-XMIN,YMAX-YMIN);
  for(let r=0;r<H;r++){
    for(let c=0;c<W;c++){
      const x=xAtCol(c), y=yAtRow(r);
      let val; try{val=fn({x,y});}catch{val=NaN;}
      if(!inRange(val)) continue;
      if(Math.abs(val)<eps) grid[r][c]=mark;
    }
  }
}

// ---------------- Main ----------------
const grid = makeCanvas();
drawAxes(grid);

const compiled = argv.expr.map(compileExpr);
compiled.forEach((ce,i)=>{
  const ch = chars[i%chars.length];
  if(ce.usesY) plotImplicit(grid,ce.eval,ch);
  else plotExplicit(grid,ce.eval,ch);
});

// ---------------- Evaluations ----------------
if(argv.eval){
  argv.eval.forEach((expr,i)=>{
    const evalExpr = math.parse(expr).compile();
    const x = Array.isArray(argv.x)?argv.x[i]:argv.x;
    const y = Array.isArray(argv.y)?argv.y[i]:argv.y;
    const t = Array.isArray(argv.t)?argv.t[i]:argv.t;
    const markFlag = Array.isArray(argv.mark)?argv.mark[i]:argv.mark;
    const labelFlag = Array.isArray(argv.label)?argv.label[i]:argv.label;
    const scope={x,y,t};
    let result;
    try{
      result = evalExpr.evaluate(scope);
      console.log(`Eval ${i+1}: ${expr} with ${JSON.stringify(scope)} = ${result}`);

      if(x!==undefined && y===undefined && t===undefined) scope.y=result;

      if(markFlag){
        const c=colAtX(scope.x), r=rowAtY(scope.y);
        if(c>=0 && c<W && r>=0 && r<H){
          grid[r][c]=argv.markchar;
          const labelText = labelFlag || `(${scope.x?.toFixed(2)}, ${scope.y?.toFixed(2)})`;
          annotations.push(`${argv.markchar} ${labelText}`);
        }
      }
    }catch(err){ console.error(`Evaluation failed for ${expr}:`,err.message); }
  });
}

// ---------------- Render ----------------
for(let r=0;r<H;r++){
  let line="";
  for(let c=0;c<W;c++){
    const ch = grid[r][c];
    if(ch===' '||ch==='-'||ch==='|'||ch==='+') line+=ch;
    else{
      const idx = chars.indexOf(ch);
      const color = COLORS[idx % COLORS.length];
      line+= color+ch+RESET;
    }
  }
  console.log(line);
}

// Legend
console.log("\nLegend:");
compiled.forEach((c,i)=>{
  const color = COLORS[i % COLORS.length];
  console.log(`${color}${chars[i%chars.length]}${RESET}: ${c.raw}`);
});

// Annotations
if(annotations.length>0){
  console.log("\nAnnotations:");
  annotations.forEach(a=>console.log(" "+a));
}

// Axis info
console.log(`\nx:[${XMIN.toFixed(2)}, ${XMAX.toFixed(2)}] y:[${YMIN.toFixed(2)}, ${YMAX.toFixed(2)}] size:${W}x${H}`);
