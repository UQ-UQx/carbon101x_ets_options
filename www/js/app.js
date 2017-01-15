// As JQuery will be used for majority of our JS code, you can attach it to the global scope
global.$ = global.jQuery = require("jquery");
require("../../node_modules/jquery-ui-dist/jquery-ui.js");
var d3 = require('d3');
var SingleStackedBarChart = require('./stackedbarchart.js');

// Any special library you want to use can be installed through npm and imported into the specifc files.
// Most of these may not need variables attached in order to use them, see their documentation.
require('bootstrap');

var ets_data = {
                'goals': {'penalty': 0, 'avgcostpertco2e': 16},
                'values': {'carbon_footprint': 3500000, 'free_allowances': 1200000, 'compliance_obligation': 2300000, 'penalty_price': 50},
                'projects': [
                  {'id':1, 'name': 'Auction Allowances', 'type': 'ets', 'price': 22, 'limit': 1500000, 'colour':'#3366cc', 'optimal_purchase_volume':1350000 },
                  {'id':2, 'name': 'Carbon Offsets', 'type': 'ets', 'price': 4, 'limit': 500000, 'colour':'#f4ad42', 'optimal_purchase_volume':500000 },
                  {'id':3, 'name': 'Motion Sensor Lighting Retrofit', 'type': 'project', 'price': 10, 'volume': 250000, 'colour':'#0de0e8', 'optimal_purchase_volume':250000 },
                  {'id':4, 'name': 'Electric Car Fleet', 'type': 'project', 'price': 5000, 'volume': 1500000, 'colour':'#ff9900', 'optimal_purchase_volume':0 },
                  {'id':5, 'name': 'Power On Use Vending Machines', 'type': 'project', 'price': 2, 'volume': 200000, 'colour':'#109618', 'optimal_purchase_volume':200000 },
                ]
              };
var penalty = 0;
var avgcostpertco2e = 0;
var projects;
var itemOrder = ['item_1,item_2,item_3,item_4,item_5'];

var selected_options = [];
var selected_options_cost = [];
var project_names = [];
var project_colours = [];

var VolumeComplianceChart;
var CostChart;

/* Util functions */
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}

function init()
{
  penalty = ets_data['goals']['penalty'];
  avgcostpertco2e = ets_data['goals']['avgcostpertco2e'];

  projects = ets_data['projects'];

  items_html = "";
  for ( var key in projects ) {
    items_html += '<li id="item_' + projects[key].id + '" class="ui-state-default movecursor"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>';
    items_html += '<table border="0">';
    items_html += '    <tr>';
    items_html += '      <td width="20">';
    items_html += '         <div class="checkbox_container"><input type="checkbox" name="options" id="options" value="' + projects[key].id + '"/></div>';
    items_html += '      </td>';
    items_html += '      <td>';
    items_html += '         <label for="option_' + projects[key].id + '">' + projects[key].name + '</label><span class="maccselector_status"></span></div>';
    items_html += '      </td>';
    items_html += '    </tr>';
    items_html += '    <tr>';
    items_html += '      <td>';
    items_html += '         &nbsp;';
    items_html += '      </td>';
    items_html += '      <td>';
    if (projects[key].type == "project")
    {
      items_html += '       Price: $' + projects[key].price + "<br/>";
      items_html += '       <strong>Volume:</strong> ' + numberWithCommas(projects[key].volume);
    }
    else{
      items_html += '       Price: $' + projects[key].price;
      items_html += '      , Limit: ' + numberWithCommas(projects[key].limit) + "<br/>";
      items_html += '<div class="form-group">';
      items_html += '<label for="volume_' + projects[key].id + '">Volume:&nbsp;</label>' + '<input type="input" class="form-control" id="volume_' + projects[key].id + '">' + "<br/>";
      items_html += '</div>';
    }
    items_html += '      </td>';
    items_html += '    </tr>';
    items_html += '</table>';
    items_html += '</li>';

  }
  $('#sortable').append(items_html);

  $('#sortable').sortable({
     update: function(event, ui) {
        itemOrder = $(this).sortable('toArray').toString();
     }
  });

  // format values with ,
  $("input[id^='volume_']").focusout(function(e) {
    var entered_value = e.target.value;
    // remove any commas added by the user
    entered_value = replaceAll(entered_value,',','');
    entered_value = numberWithCommas(entered_value);
    $('#'+e.target.id).val(entered_value);
    update();
  });

  $("input[name='options']").change(function(event){
    update();
  });
}

function update(){
  // Get list of all selected checkboxes
  var selectedOptions = [];

  selectedOptions = $("input[name='options']:checked").map(function() {
          return parseInt(this.value);
   }).get();

   var data = [];
   var data_cost = [];
   project_names = [];
   project_colours = [];
   obj = {};
   cost_obj = {};
   obj.year = "Year 1";
   cost_obj.year = "Year 1";
   var volume_total = 0;
   var cost_total = 0;
  // Set selected bars on chart
  projects.forEach(function(element) {

    var id = element.id;
    if ($.inArray(id, selectedOptions)!=-1)
    {
      var projectname = element.name;
      var projectcolour = element.colour;
      var price = element.price;

      var vol_input = 0;
      if (element.type=="ets"){
        vol_input = $('#volume_'+ id).val();
        vol_input = replaceAll(vol_input, ',', '')
      }
      else{
        vol_input = element.volume;
      }
      if ((vol_input!=""))
      {
        obj[projectname] = vol_input;
        project_names.push(projectname);
        project_colours.push(projectcolour);
        volume_total += parseInt(vol_input);

        cost = parseInt(vol_input) * price;
        cost_total += cost;

        cost_obj[projectname] = cost;
      }
    }
  });
  data.push(obj);

  selected_options = data;
  selected_options_cost = data_cost;

  var maxamount = ets_data['values']['compliance_obligation'];
  if (volume_total>maxamount){
    maxamount = volume_total;
  }

  //update chart
  VolumeComplianceChart.attr('data', selected_options);
  VolumeComplianceChart.attr('projects_names', project_names);
  VolumeComplianceChart.attr('project_colours', project_colours);
  VolumeComplianceChart.attr('maxamount', maxamount);
  VolumeComplianceChart.update();

  // calcualte penalty
  var penalty_cost = calculate_penalty(ets_data['values']['carbon_footprint'], ets_data['values']['free_allowances'], volume_total, ets_data['values']['penalty_price'])
  if (penalty_cost>0)
  {
    project_names.push('Penalty Cost');
    project_colours.push('#dc3912');
    cost_obj['Penalty Cost'] = penalty_cost;
    cost_total += penalty_cost;
  }
  data_cost.push(cost_obj);

  CostChart.attr('data', selected_options_cost);
  CostChart.attr('projects_names', project_names);
  CostChart.attr('project_colours', project_colours);
  CostChart.attr('maxamount', cost_total);
  CostChart.update(penalty_cost);

  //update penalty cost display
  $('#penalty_dsp').html('$' + numberWithCommas(penalty_cost));
  //update avgcostpertco2e display
  var avgcostpertco2e = cost_total/ets_data['values']['carbon_footprint'];
  avgcostpertco2e = avgcostpertco2e.toFixed(2);
  $('#avgcostpertco2e_dsp').html('$' + numberWithCommas(avgcostpertco2e));

  //update feedback
  feedback(penalty_cost);
}

function feedback(penalty){
  feedback_html = "";
  // Check order
  if (itemOrder!="item_5,item_2,item_3,item_1,item_4")
  {
    feedback_html += "<li>Make sure that the projects and ETS Options are ordered by Price.</li>";
  }

  // Check enabled project

  var selectedOptions = [];

  selectedOptions = $("input[name='options']:checked").map(function() {
          return parseInt(this.value);
  }).get();

  mustbe_selectedOptions = ["1","2","3","5"];

  if(selectedOptions.sort().join(',')=== mustbe_selectedOptions.sort().join(',')){
      //alert('same members');
  }
  else{
    feedback_html += "<li>Re-consider which projects and options you have selected.</li>";
  };

  // Check Volume
  if (penalty>0){
    feedback_html += "<li>Re-consider the volume of each project you have purchased and that you have not exceeded the limit.</li>";
  }

  if (feedback_html == ""){
    feedback_html = "You have reached your goal.";
  }


  $('#feedback').html("");
  $('#feedback').html(feedback_html);

}

function calculate_penalty(carbon_footprint, free_allowances, volume_total, penalty_cost){
  var non_compliant_volume = carbon_footprint - (free_allowances + volume_total);

  var penalty = 0;

  if (non_compliant_volume>0){
    penalty += non_compliant_volume * penalty_cost;
  }
  return penalty;
}

$(document).ready(function(){

  init();
  /*
  var data = [
    { year: "Year 1", 'Project 1': "10", 'Project 2': "15", 'Project 3': "9", 'Project 4': "6" },
  ];
  var colors = ["b33040", "#d25c4d", "#f2b447", "#d9d574"];
  */

  var data = [
    { year: "Year 1" }
  ];
  var colors = [];
  var names = [];

  VolumeComplianceChart = new SingleStackedBarChart({
    "parent": ".chart",
    "chartname": "chart1",
    "showtitle": false,
    "data"  : data,
    "project_colours": colors,
    "projects_names": names,
    "showcomplianceamount" : true,
    "maxamount":ets_data['values']['compliance_obligation'],
    "complianceamount"     : ets_data['values']['compliance_obligation'],
    "compliancelabel": 'Compliance'
  });
  // render the chart
  VolumeComplianceChart.chart();

  var initial_penalty = calculate_penalty(ets_data['values']['carbon_footprint'], ets_data['values']['free_allowances'], 0, ets_data['values']['penalty_price'])

  var cost_data = [
    { year: "Year 1", "Penalty":initial_penalty }
  ];
  var cost_colors = ['#dc3912'];
  var cost_names = ['Penalty'];

  CostChart = new SingleStackedBarChart({
    "parent": ".chart2",
    "chartname": "chart2",
    "showtitle": false,
    "data"  : cost_data,
    "project_colours": cost_colors,
    "projects_names": cost_names,
    "showcomplianceamount" : false,
    "maxamount":initial_penalty,
    "yaxislbl": "$ Cost",
    "amountlbl": "Cost"
  });
  // render the chart
  CostChart.chart();

  //set penalty cost display
  $('#penalty_dsp').html('$' + numberWithCommas(initial_penalty));
  //set avgcostpertco2e display
  var avgcostpertco2e = initial_penalty/ets_data['values']['carbon_footprint'];
  avgcostpertco2e = avgcostpertco2e.toFixed(2);
  $('#avgcostpertco2e_dsp').html('$' + numberWithCommas(avgcostpertco2e));
});
