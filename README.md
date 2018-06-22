# d3-rs-sankey

[![Circle CI](https://img.shields.io/circleci/project/redsift/d3-rs-sankey.svg?style=flat-square)](https://circleci.com/gh/redsift/d3-rs-sankey)
[![npm](https://img.shields.io/npm/v/@redsift/d3-rs-sankey.svg?style=flat-square)](https://www.npmjs.com/package/@redsift/d3-rs-sankey)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://raw.githubusercontent.com/redsift/d3-rs-sankey/master/LICENSE)

`d3-rs-sankey` generate a sankey flow via the D3 reusable chart convention.

## Example

[View @redsift/d3-rs-√ on Codepen](http://codepen.io/collection/DgkEpa/)

### Line chart

![Sample bars with a bottom orientation](https://bricks.redsift.cloud/reusable/d3-rs-sankey.svg?_datum=[1,200,3100,1000]&orientation=bottom)

### Multiple series

![Sample bars with a left orientation](https://bricks.redsift.cloud/reusable/d3-rs-sankey.svg?_datum=[[1,2,4],[0,1]])

## Usage

### Browser

    <script src="//static.redsift.io/reusable/d3-rs-sankey/latest/d3-rs-sankey.umd-es2015.min.js"></script>
    <script>
        var chart = d3_rs_tree.html();
        d3.select('body').datum([ 1, 2, 3, 10, 100 ]).call(chart);
    </script>

### ES6

    import { html as chart } from "@redsift/d3-rs-sankey";
    let eml = chart();
    ...

### Require

    var chart = require("@redsift/d3-rs-sankey");
    var eml = chart.html();
    ...

## TODO
