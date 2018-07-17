import { select } from 'd3-selection';
import { range } from 'd3-array';

// adapted from https://bl.ocks.org/tomshanley/2fa3ab297168fa21e95ec8260fb13e81
//todo: only works with circular
export default function arrows() {
  
    let arrowLength = 10,
        gapLength = 50,
        arrowHeadSize = 6,
        path = d => d.path,
        parent = null,
        arrowFill = 'black';
  
    function _impl(context) {

      let selection = context.selection ? context.selection() : context,
          transition = (context.selection !== undefined);

      let totalDashArrayLength = arrowLength + gapLength

      // set up the strokes
      let arrow = parent
        .selectAll('path.arrow')
        .data(selection.data());

      let arrowEnter = arrow.enter()
        .append('path')
        .attr('class', 'arrow')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.0)
        .style('stroke-width', 1)
        .style('stroke', arrowFill);

      let arrowUpdate = arrowEnter.merge(arrow);

      if (transition === true) {
        arrowUpdate = arrowUpdate.transition(context);
      }

      arrowUpdate
        .attr('stroke-opacity', 1.0)
        .attr('d', d => d.path)
        .style('stroke-dasharray', arrowLength + ',' + gapLength);


      let arrowExit = arrow.exit();
      if (transition === true) {
        arrowExit = arrowExit.transition(context);
      }        
      arrowExit.attr('stroke-opacity', 0.0).remove();

      let headData = [];

      selection.each(function () {
        let thisPath = select(this).node();

        let pathLength = thisPath.getTotalLength();
        let numberOfArrows = Math.ceil(pathLength / totalDashArrayLength);
  
        // remove the last arrow head if it will overlap the target node
        if ((numberOfArrows - 1) * totalDashArrayLength +
            (arrowLength + (arrowHeadSize + 1)) > pathLength) {
          numberOfArrows = numberOfArrows - 1;
        }

        let arrowHeadData = range(numberOfArrows).map((d, i) => {
          let length = i * totalDashArrayLength + arrowLength;
  
          let point = thisPath.getPointAtLength(length);
          let previousPoint = thisPath.getPointAtLength(length - 2);
  
          let rotation = 0;
  
          if (point.y == previousPoint.y) {
            rotation = point.x < previousPoint.x ? 180 : 0;
          } else if (point.x == previousPoint.x) {
            rotation = point.y < previousPoint.y ? -90 : 90;
          } else {
            let adj = Math.abs(point.x - previousPoint.x);
            let opp = Math.abs(point.y - previousPoint.y);
            let angle = Math.atan(opp / adj) * (180 / Math.PI);
            if (point.x < previousPoint.x) {
              angle = angle + (90 - angle) * 2;
            }
            if (point.y < previousPoint.y) {
              rotation = -angle;
            } else {
              rotation = angle;
            }
          }

          return { x: point.x, y: point.y, rotation: rotation };
        });
       
        headData = headData.concat(arrowHeadData);   
      });

    const headFn = (d) => {
      return (
        'M' +
        d.x +
        ',' +
        (d.y - arrowHeadSize / 2) +
        ' ' +
        'L' +
        (d.x + arrowHeadSize) +
        ',' +
        d.y +
        ' ' +
        'L' +
        d.x +
        ',' +
        (d.y + arrowHeadSize / 2)
      );
    }; 

    const headRotatefn = (d) => 'rotate(' + d.rotation + ',' + d.x + ',' + d.y + ')';

    // set up the heads
    let head = parent
      .selectAll('.arrow-head')
      .data(headData);
     
    let headEnter = head
       .enter()
       .append('path')
       .attr('class', 'arrow-head')
       .attr('fill-opacity', 0.0)
       .attr('fill', arrowFill)
       .attr('d', headFn)
       .attr('transform', headRotatefn);

     let headUpdate = headEnter.merge(head);

     if (transition === true) {
       headUpdate = headUpdate.transition(context);
     }  

     headUpdate.attr('fill-opacity', 1.0)
       .attr('d', headFn)
       .attr('transform', headRotatefn);

       let headExit = head.exit();
       if (transition === true) {
         headExit = headExit.transition(context);
       }            

       headExit.attr('fill-opacity', 0.0).remove();  
    }
    
    
    _impl.arrowLength = function (value) {
      if (!arguments.length) return arrowLength
      arrowLength = value
      return _impl
    }
    
    _impl.gapLength = function (value) {
      if (!arguments.length) return gapLength
      gapLength = value
      return _impl
    }
     
    _impl.arrowHeadSize = function (value) {
      if (!arguments.length) return arrowHeadSize
      arrowHeadSize = value
      return _impl
    }
    
    _impl.parent = function (value) {
      if (!arguments.length) return parent;
      parent = value;
      return _impl;
    }

    _impl.arrowFill = function (value) {
      if (!arguments.length) return arrowFill;
      arrowFill = value;
      return _impl;
    }
    
    _impl.path = function(pathFunction) {
      if (!arguments.length) {
        return path
      }
      else{ 
        if (typeof pathFunction === "function") {
          path = pathFunction;
          return _impl
        }
        else {
          path = function() { return pathFunction }
          return _impl;
        }
      }
    };
    
    return _impl;
    
  }
  