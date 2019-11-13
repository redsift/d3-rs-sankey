
import { select } from 'd3-selection';
import { sankeyCircular, sankeyJustify } from 'd3-sankey-circular';
import { scaleOrdinal } from 'd3-scale';

import { body as tip } from '@redsift/d3-rs-tip';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  display,
  fonts,
} from '@redsift/d3-rs-theme';

const DEFAULT_SIZE = 800;
const DEFAULT_ASPECT = 1.0;
const DEFAULT_MARGIN = 32;
const DEFAULT_TIP_OFFSET = 7;
const DEFAULT_TEXT_OFFSET = 6;
const MIN_NODE = 3;
const DEFAULT_NODE_PX = 16;
const ZERO_VALUE_PX = Math.round(DEFAULT_NODE_PX / 1.618);

export default function sankeyChart(id) {
  let classed = 'chart-sankey', 
      theme = 'light',
      background = undefined,
      width = DEFAULT_SIZE,
      height = null,
      
      margin = DEFAULT_MARGIN,
      style = undefined,
      scale = 1.0,
      importFonts = true,
      onClick = null,
      onNodeOver = null,
      onNodeOut = null,
      onPathClick = null,
      pathFill = null,
      hoveredPathFill = null,
      brushedPathFill = null,
      nodeFill = null,
      label = null, 
      tipHtml = null,
      pathClass = d => d.circular ? 'circular' : null,
      onlyLinks = false,
      nodeWidth = DEFAULT_NODE_PX,
      nodePadding = 10,
      nodeAlign = sankeyJustify,
      nodeClass = null,
      labelFill = null,
      hoveredLabelFill = null,
      selectedLabelFill = null,
      brushedLabelFill = null,
      labelAlign = 'central',
      text = d => d.name;
  
  let _tickGraph = null;

  let tid = null;
  if (id) tid = 'tip-' + id;
  let rtip = tip(tid)

  function _impl(context) {
    let selection = context.selection ? context.selection() : context,
        transition = (context.selection !== undefined);
  
    let _background = background;
    if (_background === undefined) {
      _background = display[theme].background;
    }
    
    let _label = label;
    if (_label == null) {
      _label = (d) => d.data.name;
    } else if (typeof(_label) !== 'function') {
      _label = () => label;
    }

    let _pathFill = pathFill;
    if (_pathFill == null) {
      _pathFill = () => display[theme].grid;
    } else if (typeof(_pathFill) !== 'function') {
      _pathFill = () => pathFill;
    }

    let _hoveredPathFill = hoveredPathFill;
    if (_hoveredPathFill == null) {
      _hoveredPathFill = () => display[theme].grid;
    } else if (typeof(_hoveredPathFill) !== 'function') {
      _hoveredPathFill = () => hoveredPathFill;
    }

    let _brushedPathFill = brushedPathFill;
    if (_brushedPathFill == null) {
      _brushedPathFill = () => display[theme].grid;
    } else if (typeof(_brushedPathFill) !== 'function') {
      _brushedPathFill = () => brushedPathFill;
    }

    let _nodeFill = nodeFill;
    if (_nodeFill == null) {
      const color = scaleOrdinal(presentation10.standard.filter((c,i) => (i !== presentation10.names.grey)));
      _nodeFill = (d) => color(d.name ? d.name.replace(/ .*/, "") : "");
    } else if (typeof(_nodeFill) !== 'function') {
      _nodeFill = () => nodeFill;
    }

    let _labelFill = labelFill;
    if (_labelFill == null) {
      _labelFill = () => display[theme].text
    } else if (typeof(_labelFill) !== 'function') {
      _labelFill = () => labelFill;
    }
    
    let _hoveredLabelFill = hoveredLabelFill;
    if (_hoveredLabelFill == null) {
      _hoveredLabelFill = () => display[theme].text
    } else if (typeof(_hoveredLabelFill) !== 'function') {
      _hoveredLabelFill = () => hoveredLabelFill;
    }

    let _selectedLabelFill = selectedLabelFill;
    if (_selectedLabelFill == null) {
      _selectedLabelFill = () => display[theme].text
    } else if (typeof(_selectedLabelFill) !== 'function') {
      _selectedLabelFill = () => selectedLabelFill;
    }

    let _brushedLabelFill = brushedLabelFill;
    if (_brushedLabelFill == null) {
      _brushedLabelFill = () => display[theme].text
    } else if (typeof(_brushedLabelFill) !== 'function') {
      _brushedLabelFill = () => brushedLabelFill;
    }
    
    rtip.offset([ -DEFAULT_TIP_OFFSET, 1 ]).style(null).html(tipHtml).transition(333);

    selection.each(function() {
      let node = select(this);  

      let her = node.datum() || {};
      const n = her.nodes || [];
      const l = her.links || [];

      let sh = height || Math.round(width * DEFAULT_ASPECT);
      
      // SVG element
      let sid = null;
      if (id) sid = 'svg-' + id;

      let root = svg(sid)
                  .width(width).height(sh).margin(margin).scale(scale)
                  .background(_background)
                  .overflow(true);
      let tnode = node;
      if (transition === true) {
        tnode = node.transition(context);
      }
    
      let w = root.childWidth(),
          h = root.childHeight();        
      let _style = style;
      if (_style === undefined) {
        // build a style sheet from the embedded charts
        _style = [ _impl, rtip ].filter(c => c != null).reduce((p, c) => p + c.defaultStyle(theme, w), '');
      }    

      root.style(_style);
      tnode.call(root);

      let snode = node.select(root.self());
      let elmS = snode.select(root.child());
      
      elmS.call(rtip);

      let g = elmS.select(_impl.self())
      if (g.empty()) {
        g = elmS.append('g').attr('class', classed).attr('id', id);
        g.append('g').attr('class', 'paths');
        g.append('g').attr('class', 'nodes');
        g.append('g').attr('class', 'labels');
        g.append('g').attr('class', 'overlays');
      }
      
      const gPaths = g.select('g.paths');
      const gNodes = g.select('g.nodes');
      const gLabels = g.select('g.labels');

      const sankeyFn = sankeyCircular()
        .nodeWidth(nodeWidth)
        .nodePadding(nodePadding)
        .nodeAlign(nodeAlign)
        .size([w, h]);


      // Compute the new sankey layout.
      let graph = _tickGraph; 
      if (onlyLinks == false || graph == null) {
        graph = sankeyFn({
          nodes: n.map(d => Object.assign({}, d)),
          links: l.map(d => Object.assign({}, d))
        });      
      } else if (onlyLinks) {
        sankeyFn.update({
          nodes: graph.nodes,
          links: graph.links
        });
      }

      _tickGraph = graph;
      
      const nodes = graph.nodes;
      const links = graph.links;
      
      let rects = gNodes.selectAll('path').data(nodes, (d, i) => d.id || i);
     
      // Enter any new nodes at the parent's previous position.
      let nodeEnter = rects.enter().append('path')
                        .attr('class', 'node')
                        .attr('fill-opacity', 0.0)
                        .attr('fill', _nodeFill)
                        .on('mouseover', function (d) {
                          if (onNodeOver) onNodeOver(d);
                        
                          if (rtip.html() == null) return;
                          rtip.show.apply(this, [ d ]);
                        })
                        .on('mouseout', function () {
                          if (onNodeOut) onNodeOut();

                          rtip.hide.apply(this);
                        });
      // Transition nodes to their new position.
      let nodeUpdate = nodeEnter.merge(rects)
            .attr('class', nodeClass);

      nodeUpdate.on('click', onClick);

      if (transition === true) {
        nodeUpdate = nodeUpdate.transition(context);
      }
      nodeUpdate.attr('d', d => {
        const w = Math.round(d.x1 - d.x0);
        const w2 = w / 2;
        const px = Math.max(Math.round(d.y1 - d.y0), MIN_NODE);

        const srcValue = d.sourceLinks.reduce((p,c) => p + c.value, 0);
        const tgtValue = d.targetLinks.reduce((p,c) => p + c.value, 0);

        let srcPx = ZERO_VALUE_PX,
            targetPx = ZERO_VALUE_PX;

        if (tgtValue == 0) {
          srcPx = px;
        } else if (srcValue == 0) {
          targetPx = px;
        } else {
          const scale = Math.max(srcValue, tgtValue) / px;
          srcPx = (srcValue / scale);
          targetPx = (tgtValue / scale);
        }

        srcPx = Math.min(px, srcPx);
        targetPx = Math.min(px, targetPx);

        return `M${(d.x0)},${(d.y0)} l${w},0 l0,${srcPx} l${-w2},0 l0,${targetPx-srcPx} l${-w2},0 Z`;
      })
      .attr('fill-opacity', d => (d.name || d.id) ? 1.0 : 0.0);

      // Transition exiting nodes to the parent's new position.
      let nodeExit = rects.exit();
      if (transition === true) {
        nodeExit = nodeExit.transition(context);
      }

      nodeExit
          .attr('fill-opacity', 0.0)
          .remove();
    
      rtip.hide();
      
      let link = gPaths.selectAll('path').data(links, d => d.source.index << 16 | d.target.index); // stability key
      let linkEnter = link.enter()
        .append('path')
          .attr('fill', 'none')
          .attr('stroke-opacity', 0.66)
          .attr('stroke-width', 0.0);

      let linkUpdate = linkEnter.merge(link)
                          .attr('class', pathClass);
      
      linkUpdate.on('click', onPathClick);

      if (transition === true) {
        linkUpdate = linkUpdate.transition(context);
      }

      linkUpdate.attr('d', d => d.path)
        .attr('stroke', x => x.hovered ? _hoveredPathFill(x) : x.brushed ? _brushedPathFill(x) : _pathFill(x))
        .attr('stroke-width', d => Math.max(1, d.width));
      
      let linkExit = link.exit();
      if (transition === true) {
        linkExit = linkExit.transition(context);
      }
      
      linkExit
        .attr('stroke-opacity', 0.0)
        .remove();  


      const labelX = (d) => (labelAlign == 'central') ? d.x0 < w / 2 ? d.x1 + DEFAULT_TEXT_OFFSET : d.x0 - DEFAULT_TEXT_OFFSET :
          (labelAlign == 'stagger' && d.depth % 2 == 0) ? d.x0 < w / 2 ? d.x0 : d.x1 :
          (d.x0 + d.x1) / 2;
      

      const labelY = (d) => (labelAlign == 'central') ? (d.y1 + d.y0) / 2 :
          (labelAlign == 'top') ? d.y0 - DEFAULT_TEXT_OFFSET :
          (labelAlign == 'bottom') ? d.y1 + DEFAULT_TEXT_OFFSET :
          (d.depth % 2 == 0) ? d.y0 - DEFAULT_TEXT_OFFSET : d.y1 + DEFAULT_TEXT_OFFSET; // staggered
      

      let label = gLabels.selectAll('text').data(nodes, (d, i) => d.id || i);  
      let labelEnter = label.enter()
        .append('text')
          .attr('x', labelX) 
          .attr('y', labelY)   
          .attr('fill-opacity', 0.0)
          .on('mouseover', onNodeOver)
          .on('mouseout',  onNodeOut)
          .on('click', onClick);

      let labelUpdate = labelEnter.merge(label)
          .attr('text-anchor', d => (labelAlign == 'central' || (labelAlign == 'stagger' && d.depth % 2 == 0)) ? d.x0 < w / 2 ? 'start' : 'end' :
            'middle'
          )
          .attr('dominant-baseline', (d) => (labelAlign == 'central') ? 'central' : 
                                          (labelAlign == 'top') ? 'alphabetic' :
                                          (labelAlign == 'bottom') ? 'hanging' :
                                          (d.depth % 2 == 0) ? 'alphabetic' : 'hanging'
          )    
          .attr('class', 'default') //todo: cfg
          .text(text); //todo: cfg
      
      if (transition === true) {
        labelUpdate = labelUpdate.transition(context);
      }

      labelUpdate.attr('fill-opacity', 1.0)      
                .attr('x', labelX)
                .attr('y', labelY)    
                .attr('fill', x => x.hovered ? _hoveredLabelFill(x) : x.selected ? _selectedLabelFill(x) : x.brushed ? _brushedLabelFill(x) : _labelFill(x));

      let labelExit = label.exit();
      if (transition === true) {
        labelExit = labelExit.transition(context);
      }
      
      labelExit
        .attr('fill-opacity', 0.0)
        .remove();
    });
  }
  
  _impl.self = function() { return 'g' + (id ?  '#' + id : '.' + classed); }

  _impl.id = function() {
    return id;
  };

  _impl.defaultStyle = (_theme, _width) => `
                  ${_impl.importFonts() ? fonts.variable.cssImport : ''}  
                  ${_impl.self()} { 
                    font-size: ${fonts.variable.sizeForWidth(_width)};
                  }
                  ${_impl.self()} text { 
                    pointer-events: none;
                    user-select: none;
                  }
                  ${_impl.self()} text.default { 
                    font-family: ${fonts.variable.family};
                    font-weight: ${fonts.variable.weightColor};   
                  }
                  ${_impl.self()} g.nodes path {
                    stroke: ${display[_theme].axis};
                    stroke-width: 0; 
                    shape-rendering: crispEdges;
                  }
                  ${_impl.self()} path {
                    pointer-events: all;
                  }
                `;
  
  _impl.importFonts = function(value) {
    return arguments.length ? (importFonts = value, _impl) : importFonts;
  };

  _impl.classed = function(value) {
    return arguments.length ? (classed = value, _impl) : classed;
  };
    
  _impl.background = function(value) {
    return arguments.length ? (background = value, _impl) : background;
  };

  _impl.theme = function(value) {
    return arguments.length ? (theme = value, _impl) : theme;
  };  

  _impl.size = function(value) {
    return arguments.length ? (width = value, height = null, _impl) : width;
  };
    
  _impl.width = function(value) {
    return arguments.length ? (width = value, _impl) : width;
  };  

  _impl.height = function(value) {
    return arguments.length ? (height = value, _impl) : height;
  }; 

  _impl.scale = function(value) {
    return arguments.length ? (scale = value, _impl) : scale;
  }; 

  _impl.margin = function(value) {
    return arguments.length ? (margin = value, _impl) : margin;
  };   

  _impl.style = function(value) {
    return arguments.length ? (style = value, _impl) : style;
  }; 
  
  _impl.onClick = function(value) {
    return arguments.length ? (onClick = value, _impl) : onClick;
  };   

  _impl.onNodeOver = function(value) {
    return arguments.length ? (onNodeOver = value, _impl) : onNodeOver;
  };   
  
  _impl.onNodeOut = function(value) {
    return arguments.length ? (onNodeOut = value, _impl) : onNodeOut;
  };   
  
  _impl.onPathClick = function(value) {
    return arguments.length ? (onPathClick = value, _impl) : onPathClick;
  }; 

  _impl.pathFill = function(value) {
    return arguments.length ? (pathFill = value, _impl) : pathFill;
  }; 

  _impl.hoveredPathFill = function(value) {
    return arguments.length ? (hoveredPathFill = value, _impl) : hoveredPathFill;
  }; 
  
  _impl.brushedPathFill = function(value) {
    return arguments.length ? (brushedPathFill = value, _impl) : brushedPathFill;
  }; 
  
  _impl.nodeFill = function(value) {
    return arguments.length ? (nodeFill = value, _impl) : nodeFill;
  };

  _impl.label = function(value) {
    return arguments.length ? (label = value, _impl) : label;
  };

  _impl.labelFill = function(value) {
    return arguments.length ? (labelFill = value, _impl) : labelFill;
  }; 
  
  _impl.hoveredLabelFill = function(value) {
    return arguments.length ? (hoveredLabelFill = value, _impl) : hoveredLabelFill;
  }; 
  
  _impl.brushedLabelFill = function(value) {
    return arguments.length ? (brushedLabelFill = value, _impl) : brushedLabelFill;
  }; 
  
  _impl.selectedLabelFill = function(value) {
    return arguments.length ? (selectedLabelFill = value, _impl) : selectedLabelFill;
  }; 
  
  _impl.labelAlign = function(value) {
    return arguments.length ? (labelAlign = value, _impl) : labelAlign;
  }; 

  _impl.tipHtml = function(value) {
    return arguments.length ? (tipHtml = value, _impl) : tipHtml;
  };  

  _impl.pathClass = function(value) {
    return arguments.length ? (pathClass = value, _impl) : pathClass;
  };  

  _impl.onlyLinks = function(value) {
    return arguments.length ? (onlyLinks = value, _impl) : onlyLinks;
  };  

  _impl.nodeWidth = function(value) {
    return arguments.length ? (nodeWidth = value, _impl) : nodeWidth;
  };  

  _impl.nodePadding = function(value) {
    return arguments.length ? (nodePadding = value, _impl) : nodePadding;
  };  
  
  _impl.nodeAlign = function(value) {
    return arguments.length ? (nodeAlign = value, _impl) : nodeAlign;
  };    

  _impl.nodeClass = function(value) {
    return arguments.length ? (nodeClass = value, _impl) : nodeClass;
  };   

  _impl.getNodes = function() {
    return _tickGraph ? _tickGraph.nodes : null;
  };  

  _impl.text = function(value) {
    return arguments.length ? (text = value, _impl) : text;
  };

  return _impl;
}