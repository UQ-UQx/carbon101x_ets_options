////
//
// stackedbarchart - This function will return a reusable Stacked Bar Chart.
//
// parent     = A mandatory element indicating the parent node of this chart.
// data       = The data to be graphed in this chart.
// width      = The width in pixels of this chart.
// height     = The height in pixels of this chart.
// xoffset    = The x offset (relative to the parent) in pixels where we will
//              start rendering this chart.
// yoffset    = The y offset (relative to the parent) in pixels where we will
//              start rendering this chart.
// complianceamount= A line is drawn for the compliance line.
// showtitle = Boolean to show chart title.
// title     = The title of the chart.
// xaxislbl  = The x axis label.
// yaxislbl  = The y axis label.
//
////

var d3 = require('d3');
var d3legend = require('d3-legend')(d3);
var d3tip = require('d3-tip')(d3);

function SingleStackedBarChart(config)
{

  // Default parameters.
  var p =
  {
    parent          : null,
    chartname          : 'chart1',
    listeners       : [],
    data            : [
                        { "year": "Year 1", 'Project 1': "10", 'Project 2': "15", 'Project 3': "9", 'Project 4': "6" }
                      ],
    project_colours  : ["#3366cc", "#dc3912", "#ff9900", "#109618"],
    projects_names : ['Project 1', 'Project 2', 'Project 3', 'Project 4'],
    width           : '900',
    height          : '500',
    margintop       : 20,
    marginright     : 100,
    marginbottom    : 30,
    marginleft      : 100,
    showcomplianceamount : true,
    complianceamount     : 100000,
    compliancelabel: 'Compliance Obligation',
    maxamount: 1500000,
    showtitle       : true,
    title           : "Compliance Volume",
    xaxislbl        : "",
    yaxislbl        : "Abatement Volume (tCO2e)",
    amountlbl       : "Volume"
  };

  var tip;
  var dataset =[];
  var total_abatementvolume = 0;

  // If we have user-defined parameters, override the defaults.
  if (config !== "undefined")
  {
    for (var prop in config)
    {
      p[prop] = config[prop];
    }
  }

  // Render this chart.
  this.chart = function()
  {

    // setup tooltips
    tip = d3tip();

    tip
          .attr('class', 'd3-tip')
          .offset([-10, 0])
          .html(function(d) {
            return "<span><strong>" + d.project + "</strong></span><br/><span><strong>" + p.amountlbl + ": " + d.volume + "</strong></span>" ;
          });

      this.update();

      window.addEventListener('resize', this.update);
  }

  // This routine supports the update operation for this chart.  This is
  // applicable when the chart should be partially updated.
  this.update = function()
  {
      // Transpose the data into layers
      //dataset = d3.layout.stack()(["Project 1", "Project 2", "Project 3", "Project 4"].map(function(project) {
      dataset = d3.layout.stack()(p.projects_names.map(function(project) {
        return p.data.map(function(d) {
          return {x: d.year, y: +d[project], project: project, volume: d[project]};
        });
      }));

      // get width and height from parent container
      p.width = $(p.parent).parent().width();
      p.height = $(p.parent).parent().height();

      var margin = {top: p.margintop, right: p.marginright, bottom: p.marginbottom, left: p.marginleft},
          width = p.width - margin.left - margin.right,
          height = p.height - margin.top - margin.bottom;

      // Set x, y

      var x;

      if (p.project_colours.length > 0) {
        x = d3.scale.ordinal()
          .domain(dataset[0].map(function(d) { return d.x; }))
          .rangeRoundBands([10, width-10], 0.02);
      }
      else {
        x = d3.scale.ordinal()
          .domain(['Year 1'])
          .rangeRoundBands([10, width-10], 0.02);
      }

/*
      var y = d3.scale.linear()
        .domain([0, d3.max(dataset, function(d) {
           var max_y = d3.max(d, function(d) { return d.y0 + d.y; });
           if (p.complianceamount>max_y)
           {
             max_y = p.complianceamount;
           }
            return max_y;
        })])
        .range([height, 0]);
*/

      var y = d3.scale.linear()
        .domain([0, p.maxamount])
        .range([height, 0]);

      // Define and draw axes
      var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(5)
        .tickSize(-width, 0, 0)
        .tickFormat( function(d) { return d } );

      var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .tickFormat(function(d) { return d } );

      // Remove previous rendering
      d3.select('#' + p.chartname).remove();

      var chartContainer = d3.select(p.parent)
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .append("g")
          .attr("id",p.chartname)
          .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      chartContainer.call(tip);

       chartContainer.append("g")
         .attr("class", "y axis")
         .call(yAxis)
         .append("text")
         .attr("transform", "rotate(-90)")
         .attr("y", 6)
         .attr("y", - (margin.left / 2 + 5))
         .attr("x", - height / 2)
         .style("text-anchor", "middle")
         .style("font-size", "90%")
         .text(p.yaxislbl);

       chartContainer.append("g")
         .attr("class", "x axis")
         .attr("transform", "translate(0," + height + ")")
         .call(xAxis);

       if (p.project_colours.length > 0) {
         // Create groups for each series, rects for each segment
       var groups = chartContainer.selectAll("g.cost")
           .data(dataset)
           .enter().append("g")
           .attr("class", "cost")
           .style("fill", function(d, i) { return p.project_colours[i]; });


       var rect = groups.selectAll("rect")
           .data(function(d) { return d; })
           .enter()
           .append("rect")
           .attr("x", function(d) { return x(d.x); })
           .attr("y", function(d) { return y(d.y0 + d.y); })
           .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
           .attr("width", x.rangeBand())
           .on('mouseover', tip.show)
           .on('mouseout', tip.hide);
       }

           // optional line for Carbon Price
           if (p.showcomplianceamount) {
             chartContainer.append("line")          // attach a line
               .style("stroke", "black")  // colour the line
               .style('stroke-width', 2)
               .attr("x1", 0)     // x position of the first end of the line
               .attr("y1", y(p.complianceamount))      // y position of the first end of the line
               .attr("x2", width)    // x position of the second end of the line
               .attr("y2", y(p.complianceamount));    // y position of the second end of the line
             chartContainer.append("text")
               .attr("x", 0)
               .attr("y", y(p.complianceamount + 50000))
               .attr("dx", 0)
               .attr("dy", ".5em")
               .text(p.compliancelabel + ": $" + p.complianceamount);
           }

  }

  // Use this routine to retrieve and update attributes.

  this.attr = function(name, value)
  {
    // When no arguments are given, we return the current value of the
    // attribute back to the caller.
    if (arguments.length == 1)
    {
      return p[name];
    }
    // Given 2 arguments we set the name=value.
    else if (arguments.length == 2)
    {
      p[name] = value;
    }
  }

}

module.exports = SingleStackedBarChart;
