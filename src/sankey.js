
import { select } from 'd3-selection';
import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
import { scaleOrdinal } from 'd3-scale';

import { body as tip } from '@redsift/d3-rs-tip';

import { html as svg } from '@redsift/d3-rs-svg';
import { 
  presentation10,
  display,
  fonts,
  widths,
} from '@redsift/d3-rs-theme';

const DEFAULT_SIZE = 800;
const DEFAULT_ASPECT = 1.0;
const DEFAULT_MARGIN = 32;
const DEFAULT_TIP_OFFSET = 7;

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
      pathFill = null,
      nodeFill = null,
      label = null, 
      tipHtml = null;
  
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

    let _nodeFill = nodeFill;
    if (_nodeFill == null) {
      const color = scaleOrdinal(presentation10.standard);
      _nodeFill = (d) => color(d.name.replace(/ .*/, ""));
    } else if (typeof(_nodeFill) !== 'function') {
      _nodeFill = () => nodeFill;
    }

    rtip.offset([ -DEFAULT_TIP_OFFSET, 1 ]).style(null).html(tipHtml).transition(333);

    selection.each(function() {
      let node = select(this);  

      let her = node.datum();

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
      }

      const sankeyLayout = (data) => {
        let fn = sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[0, 0], [w, h]]);
        return fn({
          nodes: data.nodes.map(d => Object.assign({}, d)),
          links: data.links.map(d => Object.assign({}, d))
        });
      }

      // Compute the new sankey layout.
      const { nodes, links } = sankeyLayout(her);      

      let rects = g.selectAll('rect').data(nodes, (d, i) => d.id || i);
     
      // Enter any new nodes at the parent's previous position.
      let nodeEnter = rects.enter().append('rect')
                        .attr('class', 'node')
                        .attr('fill-opacity', 0.0)
                        .attr('fill', _nodeFill)
                        .on('mouseover', function (d) {
                          if (rtip.html() == null) return;
                          rtip.show.apply(this, [ d ]);
                        })
                        .on('mouseout', function () {
                          rtip.hide.apply(this);
                        });
      // Transition nodes to their new position.
      let nodeUpdate = nodeEnter.merge(rects);
      
      if (transition === true) {
        nodeUpdate = nodeUpdate.transition(context);
      }

      nodeUpdate.attr('x', d => d.x0)
        .attr('y', d => d.y0)
        .attr('height', d => d.y1 - d.y0)
        .attr('width', d => d.x1 - d.x0)
        .attr('fill-opacity', 1.0);

      // Transition exiting nodes to the parent's new position.
      let nodeExit = rects.exit();
      if (transition === true) {
        nodeExit = nodeExit.transition(context);
      }

      nodeExit
          .attr('fill-opacity', 0.0)
          .remove();
    
      rtip.hide();

      if (onClick) {    
        nodeUpdate.on('click', onClick);
      }

      let link = g.selectAll('path').data(links); // stability key?

      let linkEnter = link.enter()
        .append('path')
          .attr('fill', 'none')
          .attr('stroke-opacity', 0.0);
      let linkUpdate = linkEnter.merge(link);
      
      if (transition === true) {
        linkUpdate = linkUpdate.transition(context);
      }

      linkUpdate.attr('d', sankeyLinkHorizontal())
        .attr('stroke', d => 'grey')
        .attr('stroke-opacity', 0.33)
        .attr('stroke-width', d => Math.max(1, d.width));
      
      let linkExit = link.exit();
      if (transition === true) {
        linkExit = linkExit.transition(context);
      }
      
      linkExit
        .attr('stroke-opacity', 0.0)
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
                  ${_impl.self()} text.default { 
                    font-family: ${fonts.variable.family};
                    font-weight: ${fonts.variable.weightColor};  
                    fill: ${display[_theme].text}                
                  }
                  ${_impl.self()} text::selection {
                    fill-opacity: 1.0; 
                  }
                  ${_impl.self()} rect {
                    stroke: ${display[_theme].axis};
                    stroke-width: ${widths.outline}; 
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

  _impl.pathFill = function(value) {
    return arguments.length ? (pathFill = value, _impl) : pathFill;
  }; 
  
  _impl.nodeFill = function(value) {
    return arguments.length ? (nodeFill = value, _impl) : nodeFill;
  };

  _impl.label = function(value) {
    return arguments.length ? (label = value, _impl) : label;
  }; 

  _impl.tipHtml = function(value) {
    return arguments.length ? (tipHtml = value, _impl) : tipHtml;
  };  

  return _impl;
}