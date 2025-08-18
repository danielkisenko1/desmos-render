# desmos-ascii-render

Terminal-based ASCII graphing CLI inspired by Desmos.  
Plot explicit and implicit functions, evaluate points, and annotate directly in the terminal.

---

## Installation

Globally via npm:

```bash
npm install -g desmos-ascii-render

Plot a single curve:

```bash
desmos-ascii-render -e "y=sin(x)"

Multiple curves:
```bash
desmos-ascii-render -e "y=sin(x)" -e "y=cos(x)"

High-frequency curves:
```bash
desmos-ascii-render -e "y=sin(10*x)" --xmin -10 --xmax 10 --ymin -2 --ymax 2
