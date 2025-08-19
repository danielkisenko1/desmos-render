Terminal-based ASCII graphing CLI inspired by Desmos.
Plot explicit and implicit functions, evaluate points, and annotate directly in the terminal.

---

## Installation

Globally via npm:

```bash
npm install -g desmos-ascii-render
```

---

## Basic Usage

Plot a single curve:


```bash
desmos-ascii-render -e "y=sin(x)"
```

Multiple curves:

```bash
desmos-ascii-render -e "y=sin(x)" -e "y=cos(x)"
```

High-frequency curves:

```bash
desmos-ascii-render -e "y=sin(10*x)" --xmin -10 --xmax 10 --ymin -2 --ymax 2
```

---

## Viewport / Canvas Options

| Option      | Description              | Example        |
|-------------|--------------------------|----------------|
| --xmin      | Minimum x value          | --xmin -10     |
| --xmax      | Maximum x value          | --xmax 10      |
| --ymin      | Minimum y value          | --ymin -2      |
| --ymax      | Maximum y value          | --ymax 2       |
| --width     | Canvas width in chars    | --width 120    |
| --height    | Canvas height in rows    | --height 40    |
| --zoom      | Zoom in/out              | --zoom 2       |
| --panx      | Pan x axis               | --panx 3       |
| --pany      | Pan y axis               | --pany -1      |
| --ticks     | Show axis ticks          | --ticks true   |

---

## Curve Appearance

| Option        | Description              | Example        |
|---------------|--------------------------|----------------|
| --chars       | Characters for curves    | --chars "*o+" |
| Colors        | Each curve auto-colored  | -              |

---

## Evaluating Points & Annotations

| Option        | Description                  | Example                   |
|---------------|------------------------------|---------------------------|
| --eval        | Expression to evaluate       | --eval "sin(x)"           |
| --x           | x value for evaluation       | --x 1.57                  |
| --y           | Optional y value             | --y 2                     |
| --t           | Optional t for parametric    | --t 0.5                   |
| --mark        | Mark point on graph          | --mark true               |
| --markchar    | Character for marking        | --markchar "@"            |
| --label       | Label for point              | --label "(π/2,1)"        |
| --labeloffset | Horizontal offset of label   | --labeloffset 2           |

---

## Examples

Multiple curves with evaluation:

```bash
desmos-ascii-render -e "y=sin(x)" -e "y=cos(x)" \
  --eval "sin(x)" --x 1.57 --mark --label "(π/2,1)" \
  --eval "cos(x)" --x 3.1416 --mark --label "cos(π)=-1"
```

Zoom and Pan:

```bash
desmos-ascii-render -e "y=sin(x)" --zoom 2 --panx 2 --pany 0
```

Implicit plot (circle):

```bash
desmos-ascii-render -e "x^2 + y^2 - 9"
```

High-frequency sine:

```bash
desmos-ascii-render -e "y=sin(10*x)" --xmin -10 --xmax 10 --ymin -2 --ymax 2
```

---

## Features

- Plot explicit (y=f(x)) and implicit (F(x,y)=0) equations
- High-frequency curves with oversampling
- Zoom and pan (--zoom, --panx, --pany)
- Colored curves for multiple expressions
- Axes, ticks, and legend
- Evaluate multiple points (--eval) and mark them (--mark)
- Annotations printed below the graph
- Multiple curves and evaluation points in one command

---

## Updating to Latest Version

If you have already installed desmos-ascii-render and a new version is published:

```bash
npm install -g desmos-ascii-render
```

This updates to the latest version, including any fixes like ESM compatibility.

---

## License

MIT © Daniel Kisenko
