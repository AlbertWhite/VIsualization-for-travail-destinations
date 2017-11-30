
var country_data = [];
var index_country = [];
var year = 2014;

d3.select(window).on("resize", throttle);

var zoom = d3.behavior.zoom()
.scaleExtent([1, 9])
.on("zoom", move);


var width = document.getElementById('container').offsetWidth;
var height = width / 2;

var topo,projection,path,svg,g;

var graticule = d3.geo.graticule();

var tooltip = d3.select("#container").append("div").attr("class", "tooltip hidden");

setup(width,height);

$(function() {
  $( "#slider" ).slider({
    orientation: "horizontal",
    range: "min",
    min: 2005,
    max: 2014,
    value: 2014,
    slide: function( event, ui ) {
      year = ui.value;

      $("#slider-year").text("YEAR "+year);
      redraw(year);
    }
  });
}); 

function setup(width,height){
  projection = d3.geo.mercator()
  .translate([(width/2), (height/2)])
  .scale( width / 2 / Math.PI);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#container").append("svg")
  .attr("width", width)
  .attr("height", height)
  .call(zoom)
  .on("click", click)
  .append("g");

  g = svg.append("g");

}

d3.json("data/world-topo-min.json", function(error, world) {

  var countries = topojson.feature(world, world.objects.countries).features;

  topo = countries;
  draw(topo,2014);

});

d3.json("data/country.json",function(error,country){
  country_data = country;
});

function draw(topo,year) {

  svg.append("path")
  .datum(graticule)
  .attr("class", "graticule")
  .attr("d", path);


  g.append("path")
  .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
  .attr("class", "equator")
  .attr("d", path);


  var country = g.selectAll(".country").data(topo);
  var scale = d3.scale.linear()
  .domain([0, 300])
  .range([0, 255]);

  country.enter().insert("path")
  .attr("class", "country")
  .attr("d", path)
  .attr("id", function(d,i) { 
    map_data(d.properties.name.toUpperCase(), country_data,i);

    return d.id; })
  .attr("title", function(d,i) { return d.properties.name; })
  .style("fill", function(d,i){
    if(i < index_country.length){
      var color;
      if(country_data[index_country[i]][year] == ".."){
        return "rgb(255,255,255)";
      }else{
        color = 255 - Math.round(scale(Math.sqrt(country_data[index_country[i]][year])));
      }
      return "rgb(0,"+color+",255)";
        //return "rgb("+color+","+color+",255)";        
      }
    });
      //.style("fill", function(d, i) { return d.properties.color; });
  //offsets for tooltips
  var offsetL = document.getElementById('container').offsetLeft+20;
  var offsetT = document.getElementById('container').offsetTop+10;

  //tooltips
  country
  .on("mousemove", function(d,i) {
    var result;
    var mouse = d3.mouse(svg.node()).map( function(d) { 
      return parseInt(d); 
    } );
    var result = find_data(d.properties.name.toUpperCase(), country_data);//this step takes time, so we excute it before demonstrating it
    $("#visitor_chart").empty();
    $("#cost_chart").empty();
    $("#country").empty();

    var visitor_data = [], cost_data = [];


    for(var i = 2005; i < 2015; i++){
      visitor_data.push(result[i]);
      cost_data.push(result[i+"-Cost"]); 
    }
    
    $("#country").text(result["COUNTRY"]);
    var nation = result["COUNTRY"].substr(1);
    nation = result["COUNTRY"][0]+nation.toLowerCase();
    nation = nation.replace(" ","_");
    index = nation.indexOf("_");
    if(index != -1){
      nation = nation.substr(0,index) + nation[index].toUpperCase()+ nation.substr(index+1);
    }
    nation = "flags/"+nation+".png";
    $("#flag").attr("src",nation);

    $(".chart").css("display","block");
    $(".chart-title-div").css("display","block");

    var x = d3.scale.linear()
    .domain([0, 75000])
    .range([0, 200]);

    var x_cost = d3.scale.linear()
    .domain([0, 200000])
    .range([0, 200]);


    d3.select("#visitor_chart")
    .selectAll("div")
    .data(visitor_data)
    .enter().append("div")
    .style("width", function(d) { return x(d) + "px"; })
    .html(function(d) { return d; });

    d3.select("#cost_chart")
    .selectAll("div")
    .data(cost_data)
    .enter().append("div")
    .style("width", function(d) { return x_cost(d) + "px"; })
    .text(function(d) { return d; });

    tooltip.classed("hidden", false)
    .attr("style", "left:"+(mouse[0]+offsetL)+"px;top:"+(mouse[1]+offsetT)+"px")
    .html("<font style='font-size:14px;'>"+d.properties.name+" "+year+"</font>"+" "+"<br/><font style='font-size:12px;'>"+"Visitors: "+result[year]+"</font>");

  })
  .on("mouseout",  function(d,i) {
    tooltip.classed("hidden", true);
    // $("#visitor_chart").empty();
    // $("#cost_chart").empty();
    // $("#country").empty();
  }); 


  //EXAMPLE: adding some capitals from external CSV file
  // d3.csv("data/country-capitals.csv", function(err, capitals) {
  //   capitals.forEach(function(i){
  //     addpoint(i.CapitalLongitude, i.CapitalLatitude, i.CapitalName );
  //   });

  //});

}

function find_data(name,country_data){
  var result;
  $.grep(country_data, function( n, i ) {
    if(n.COUNTRY == name){
      result = country_data[i];
      return country_data[i];//be careful that this return only returns this function
    }
  });
  return result;

}

function map_data(name, country_data,index){ // this function is for mapping the two different dataset: country.json and world-topo-min.json
  var result;
  $.grep(country_data, function( n, i ) {
    if(n.COUNTRY == name){
      index_country.push(i);
      result = i;
      return i;
    }
  });
  if(index_country[index] == undefined){
    index_country.push(0);
    result = 0;
  }
  return result;
}


function redraw(year) {
  width = document.getElementById('container').offsetWidth;
  height = width / 2;
  d3.select('svg').remove();
  setup(width,height);
  draw(topo,year);
}


function move() {

  var t = d3.event.translate;
  var s = d3.event.scale; 
  zscale = s;
  var h = height/4;


  t[0] = Math.min(
    (width/height)  * (s - 1), 
    Math.max( width * (1 - s), t[0] )
    );

  t[1] = Math.min(
    h * (s - 1) + h * s, 
    Math.max(height  * (1 - s) - h * s, t[1])
    );

  zoom.translate(t);
  g.attr("transform", "translate(" + t + ")scale(" + s + ")");

  //adjust the country hover stroke width based on zoom level
  d3.selectAll(".country").style("stroke-width", 1.5 / s);

}



var throttleTimer;
function throttle() {
  window.clearTimeout(throttleTimer);
  throttleTimer = window.setTimeout(function() {
    redraw(year);
  }, 200);
}


//geo translation on mouse click in map
function click() {
  var latlon = projection.invert(d3.mouse(this));
}


//function to add points and text to the map (used in plotting capitals)
function addpoint(lat,lon,text) {

  var gpoint = g.append("g").attr("class", "gpoint");
  var x = projection([lat,lon])[0];
  var y = projection([lat,lon])[1];

  gpoint.append("svg:circle")
  .attr("cx", x)
  .attr("cy", y)
  .attr("class","point")
  .attr("r", 1.5);

  //conditional in case a point has no associated text
  if(text.length>0){

    gpoint.append("text")
    .attr("x", x+2)
    .attr("y", y+2)
    .attr("class","text")
    .text(text);
  }

}

