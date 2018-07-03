import { select } from 'd3-selection';
import { range } from 'd3-array';

// adapted from https://bl.ocks.org/tomshanley/2fa3ab297168fa21e95ec8260fb13e81
//todo: only works with circular
export default function arrows() {
  
    var arrowLength = 10
    var gapLength = 50
    var arrowHeadSize = 4
    var path = d => d.path;
  
    function appendArrows (selection) {
      let totalDashArrayLength = arrowLength + gapLength
  
      let arrows = selection
        .append('path')
        .attr('d', path)
        .style('stroke-width', 1)
        .style('stroke', 'black')
        .style('stroke-dasharray', arrowLength + ',' + gapLength)
  
      arrows.each(function (arrow) {
        let thisPath = select(this).node()

        let parentG = select(this.parentNode)
        let pathLength = thisPath.getTotalLength()
        let numberOfArrows = Math.ceil(pathLength / totalDashArrayLength)
  
        // remove the last arrow head if it will overlap the target node
        if (
          (numberOfArrows - 1) * totalDashArrayLength +
            (arrowLength + (arrowHeadSize + 1)) >
          pathLength
        ) {
          numberOfArrows = numberOfArrows - 1
        }
        console.log(thisPath, pathLength);
        let arrowHeadData = range(numberOfArrows).map(function (d, i) {
          let length = i * totalDashArrayLength + arrowLength
  
          let point = thisPath.getPointAtLength(length)
          let previousPoint = thisPath.getPointAtLength(length - 2)
  
          let rotation = 0
  
          if (point.y == previousPoint.y) {
            rotation = point.x < previousPoint.x ? 180 : 0
          } else if (point.x == previousPoint.x) {
            rotation = point.y < previousPoint.y ? -90 : 90
          } else {
            let adj = Math.abs(point.x - previousPoint.x)
            let opp = Math.abs(point.y - previousPoint.y)
            let angle = Math.atan(opp / adj) * (180 / Math.PI)
            if (point.x < previousPoint.x) {
              angle = angle + (90 - angle) * 2
            }
            if (point.y < previousPoint.y) {
              rotation = -angle
            } else {
              rotation = angle
            }
          }
  
          return { x: point.x, y: point.y, rotation: rotation }
        })

        let arrowHeads = parentG
          .selectAll('.arrow-heads')
          .data(arrowHeadData)
          .enter()
          .append('path')
          .attr('d', function (d) {
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
            )
          })
          .attr('class', 'arrow-head')
          .attr('transform', function (d) {
            return 'rotate(' + d.rotation + ',' + d.x + ',' + d.y + ')'
          })
          .style('fill', 'black')
      })
    }
    
    
    appendArrows.arrowLength = function (value) {
      if (!arguments.length) return arrowLength
      arrowLength = value
      return appendArrows
    }
    
     appendArrows.gapLength = function (value) {
      if (!arguments.length) return gapLength
      gapLength = value
      return appendArrows
    }
     
     appendArrows.arrowHeadSize = function (value) {
      if (!arguments.length) return arrowHeadSize
      arrowHeadSize = value
      return appendArrows
    }
  
    
    appendArrows.path = function(pathFunction) {
      if (!arguments.length) {
        return path
      }
      else{ 
        if (typeof pathFunction === "function") {
          path = pathFunction;
          return appendArrows
        }
        else {
          path = function() { return pathFunction }
          return appendArrows;
        }
      }
    };
    
    return appendArrows;
    
  }
  