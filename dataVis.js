/*
* Data Visualization - Framework
* Copyright (C) University of Passau
*   Faculty of Computer Science and Mathematics
*   Chair of Cognitive sensor systems
* Maintenance:
*   2024, Alexander Gall <alexander.gall@uni-passau.de>
*
* All rights reserved.
*/

// scatterplot axes
let xAxis, yAxis, xAxisLabel, yAxisLabel;
let radarAxes, radarAxesAngle;
let dimensions = ["dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
let channels = ["scatterX", "scatterY", "size"];
let margin, width, height, radius;
let scatter, radar, dataTable;
let colorScale=["green","blue","yellow"];
let selectedPoints = {}; 
let maxSelectedPoints = 5;
let nextId = 0;

function init() {
    margin = { top: 20, right: 20, bottom: 20, left: 50 };
    width = 600;
    height = 500;
    radius = Math.min(width, height) / 2 - 50; // Adjusting radius to fit within the chart area

    document.getElementById("defaultOpen").click();
    dataTable = d3.select('#dataTable');

    scatter = d3.select("#sp").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    radar = d3.select("#radar").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

    colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(dimensions);

    let fileInput = document.getElementById("upload"), readFile = function () {
        clear();
        let reader = new FileReader();
        reader.onloadend = function () {
            let parseData = d3.csvParse(reader.result);
            initVis(parseData);
            CreateDataTable(parseData);
            initDashboard(null);
        };
        reader.readAsBinaryString(fileInput.files[0]);
    };
    fileInput.addEventListener('change', readFile);
}

function initVis(parseData) {
    dimensions = Object.keys(parseData[0]);
    dimensions.splice(0, 1);

    console.log("dimenstion of the data set are ",dimensions)

    let y = d3.scaleLinear()
        .domain(d3.extent(parseData, d => +d[dimensions[0]]))
        .range([height - margin.bottom - margin.top, margin.top]);

    let x = d3.scaleLinear()
        .domain(d3.extent(parseData, d => +d[dimensions[1]]))
        .range([margin.left, width - margin.left - margin.right]);

    yAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + margin.left + ")")
        .call(d3.axisLeft(y));

    // yAxisLabel = yAxis.append("text")
    //     .style("text-anchor", "middle")
    //     .attr("y", -10)
    //     .attr("x", -margin.left / 2)
    //     .text(dimensions[0]);

    xAxis = scatter.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0, " + (height - margin.bottom) + ")")
        .call(d3.axisBottom(x));

    // xAxisLabel = xAxis.append("text")
    //     .style("text-anchor", "middle")
    //     .attr("x", width / 2)
    //     .attr("y", margin.bottom - 10)
    //     .text(dimensions[1]);

    yAxisLabel = yAxis.append("text")
    .attr("class", "axisLabel")
    .style("text-anchor", "middle")
    .attr("y",-30)
    .attr("x", - 40)
    .attr("transform", "rotate(-90)")
    .text(dimensions[0]);

    xAxisLabel = xAxis.append("text")
    .attr("class", "axisLabel")
    .style("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y",  margin.bottom-10) 
    .text(dimensions[1]);



    radarAxesAngle = Math.PI * 2 / dimensions.length;

    radar.selectAll(".axis")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "axis")
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => radarX(radius, i))
        .attr("y2", (d, i) => radarY(radius, i))
        .style("stroke", "black");

    radar.selectAll(".axisLabel")
        .data(dimensions)
        .enter()
        .append("text")
        .attr("text-anchor", "middle")
        .attr("x", (d, i) => radarX(radius * 1.1, i))
        .attr("y", (d, i) => radarY(radius * 1.1, i))
        .text(d => d);

    renderSpiderLines();
    
    channels.forEach(c => initMenu(c, dimensions));
    channels.forEach(c => refreshMenu(c,dimensions));

    CreateDataTable(parseData);
    renderScatterplot(parseData);
}

function clear() {

    scatter.selectAll("*").remove();
    radar.selectAll("*").remove();
    dataTable.selectAll("*").remove();

}



function CreateDataTable(parseData) {
    let table = dataTable.append("table").attr("class", "dataTable").datum(parseData);
 
    let thead = table.append("thead");
    let tbody = table.append("tbody");

    let columns = Object.keys(parseData[0]);
    thead.append("tr").selectAll("th").data(columns).enter().append("th").text(d => d);

    let rows = tbody.selectAll("tr").data(parseData).enter().append("tr");
    rows.selectAll("td").data(row => columns.map(column => ({ column, value: row[column] })))
        .enter().append("td").text(d => d.value);

    rows.on("mouseover", function () {
        d3.select(this).style("background-color", "lightgray");
    }).on("mouseout", function () {
        d3.select(this).style("background-color", "transparent");
    });

    console.log("datatable values is ", table.datum());
}
function renderScatterplot(parseData) {
    let xDomain = readMenu("scatterX");
    let yDomain = readMenu("scatterY");
    let sizeDomain = readMenu("size");

    xAxisLabel.text(xDomain);
    yAxisLabel.text(yDomain);

    let y = d3.scaleLinear()
        .domain(d3.extent(parseData, d => +d[yDomain]))
        .range([height - margin.bottom, margin.top]);

    let x = d3.scaleLinear()
        .domain(d3.extent(parseData, d => +d[xDomain]))
        .range([margin.left, width - margin.right]);

    let sizeScale = d3.scaleLinear()
        .domain(d3.extent(parseData, d => +d[sizeDomain]))
        .range([3, 10]);

    xAxis.transition().duration(1000).call(d3.axisBottom(x));
    yAxis.transition().duration(1000).call(d3.axisLeft(y));

    scatter.selectAll(".dot").remove();
    
    scatter.selectAll(".dot")
        .data(parseData)
        .enter()
        .append("circle")
        .attr("class", "dot")
        .attr("cx", d => x(d[xDomain]))
        .attr("cy", d => y(d[yDomain]))
        .attr("r", d => sizeScale(d[sizeDomain]))
        .attr("data-id", d => nextId++)
        .style("fill", d => colorScale(d.species))
        .style("opacity", 0.7)
        .on("click", function (event, d) {
            let pointId = d3.select(this).attr("data-id");
            if (selectedPoints[pointId]) {
                delete selectedPoints[pointId];
                d3.select(this).style("fill", colorScale(d.species));
            } else if (Object.keys(selectedPoints).length < maxSelectedPoints) {
                let color = d3.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255);
                selectedPoints[pointId] = { color: color, data: d };
                d3.select(this).style("fill", color);
            } else {
                alert("Maximum selected points limit reached.");
            }
            updateRadarChart();
        });
}


// function renderScatterplot(parseData) {


//     let xDomain = readMenu("scatterX");
//     let yDomain = readMenu("scatterY");
//     let sizeDomain = readMenu("size");

//     xAxisLabel.text(xDomain);
//     yAxisLabel.text(yDomain);

//     let y = d3.scaleLinear()
//         .domain(d3.extent(parseData, d => +d[yDomain]))
//         .range([height - margin.bottom, margin.top]);
//     yAxis.transition().duration(1000).call(d3.axisLeft(y));


//     let x = d3.scaleLinear()
//         .domain(d3.extent(parseData, d => +d[xDomain]))
//         .range([margin.left, width - margin.right]);

//     let sizeScale = d3.scaleLinear()
//         .domain(d3.extent(parseData, d => +d[sizeDomain]))
//         .range([3, 10]);

//     xAxis.transition().duration(1000).call(d3.axisBottom(x));
    
//     scatter.selectAll(".axisLabel").remove();

//     xAxis.selectAll(".axisLabel").remove();

//     yAxisLabel = yAxis.append("text")
//     .attr("class", "axisLabel")
//     .style("text-anchor", "middle")
//     .attr("y",-30)
//     .attr("x", - 40)
//     .attr("transform", "rotate(-90)")
//     .text(yDomain);

//     xAxisLabel = xAxis.append("text")
//     .attr("class", "axisLabel")
//     .style("text-anchor", "middle")
//     .attr("x", width / 2)
//     .attr("y",  margin.bottom-10) 
//     .text(xDomain);


//     scatter.selectAll(".dot").remove();
//     scatter.selectAll(".dot")
//         .data(parseData)
//         .enter()
//         .append("circle")
//         .attr("class", "dot")
//         .attr("cx", d => x(d[xDomain]))
//         .attr("cy", d => y(d[yDomain]))
//         .attr("r", d => sizeScale(d[sizeDomain]))
//         .attr("data-id", d => nextId++)
//         .style("fill", d => colorScale(d.species))
//         .style("opacity", 0.7);

//     scatter.selectAll(".dot").on("click", function (event, d) {
//        let color = d3.rgb(Math.random() * 255, Math.random() * 255, Math.random() * 255);
//        d3.select(this).style("fill", color);
//        //d3.select(this).classed("selected", !d3.select(this).classed("selected"));
//        let pointId = d3.select(this).attr("data-id");
//         updateRadarChart(d,color,pointId);
//     });
// }

function renderRadarChart(selectedData) {

    radar.selectAll(".radarLine").remove();

    let r = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);

    let radarLine = d3.lineRadial()
        .radius(d => r(d.value))
        .angle((d, i) => radarAngle(i))
        .curve(d3.curveLinearClosed);

    let radarData = dimensions.map(key => ({
        key: key,
        value: +selectedData[key] / d3.max(dimensions.map(d => +selectedData[d])) 
    }));

    radar.append("path")
        .datum(radarData)
        .attr("class", "selectedRadarLine")
        .attr("d", radarLine)
        .style("fill", "none")
        .style("stroke", "red")
        .style("stroke-width", 3)
        .style("opacity", 1);

    updateLegend(selectedData);
}

function renderSpiderLines() {
    let levels = 6; 
    let web = radar.append("g").attr("class", "web");

    for (let level = 0; level <= levels; level++) {
        let levelFactor = radius * (level / levels);
        web.selectAll(".level")
            .data(dimensions)
            .enter()
            .append("line")
            .attr("x1", (d, i) => radarX(levelFactor, i))
            .attr("y1", (d, i) => radarY(levelFactor, i))
            .attr("x2", (d, i) => radarX(levelFactor, (i + 1) % dimensions.length))
            .attr("y2", (d, i) => radarY(levelFactor, (i + 1) % dimensions.length))
            .attr("class", "line")
            .style("stroke", "gray")
            .style("stroke-opacity", "0.5")
            .style("stroke-width", "0.5px");
    }
}


function updateRadarChart() {
    radar.selectAll(".radarLine").remove();

    let r = d3.scaleLinear()
        .domain([0, 1])
        .range([0, radius]);

    let radarLine = d3.lineRadial()
        .radius(d => r(d.value))
        .angle((d, i) => radarAngle(i))
        .curve(d3.curveLinearClosed);

    Object.keys(selectedPoints).forEach(pointId => {
        let pointData = selectedPoints[pointId].data;
        let radarData = dimensions.map(key => ({
            key: key,
            value: +pointData[key] / d3.max(dimensions.map(d => +pointData[d]))
        }));

        radar.append("path")
            .datum(radarData)
            .attr("class", "radarLine")
            .attr("d", radarLine)
            .style("fill", "none")
            .style("stroke", selectedPoints[pointId].color)
            .style("stroke-width", 3)
            .style("opacity", 1);
    });

    updateLegend();
}

function radarAngle(index) {
    return radarAxesAngle * index - Math.PI / 2;
}


// function updateRadarChart(selectedData,color,pointId) {
    
//     scatter.selectAll(".dot.selected") 
//         .style("fill", color);

//     // if (Object.keys(selectedPoints).length < 5) {
//     //     let pointId = `point_${Object.keys(selectedPoints).length + 1}`;
//     //     selectedPoints[pointId] = { color: color, data: selectedData };
//     // } else {
//     //     alert("Maximum selected points limit reached.");
//     // }

//     if (!selectedPoints[pointId] && Object.keys(selectedPoints).length < 5) {
//         selectedPoints[pointId] = { color: color, data: selectedData };
//     } else if (!selectedPoints[pointId]) {
//         alert("Maximum selected points limit reached.");
//         return;
//     }

//     //renderScatterplot(parseData);
//     renderRadarChart(selectedData);
//     updateLegend(selectedData);
// }

function updateLegend() {
    let legend = d3.select("#legend");
    legend.selectAll("div").remove();

    Object.keys(selectedPoints).forEach((pointId, index) => {
        let pointData = selectedPoints[pointId].data;
        let originalColor = selectedPoints[pointId].color;
        let legendItem = legend.append("div")
            .attr("class", "legendItem")
            .style("color", originalColor);

        legendItem.append("span")
            .attr("class", "legendText")
            .text(`Point ${index + 1}: ${pointData.Name}`);

        legendItem.append("span")
            .attr("class", "legendRemove")
            .style("cursor", "pointer")
            .text("[x]")
            .on("click", function() {
                delete selectedPoints[pointId];
                updateRadarChart();
                scatter.selectAll(".dot")
                    .filter(function() { return d3.select(this).attr("data-id") == pointId; })
                    .style("fill", d => colorScale(d.species));
            });
    });
}

// function updateLegend(selectedData) {
//     // let legend = d3.select("#legend");
//     // legend.selectAll("div").remove(); 
//     // console.log("selectedPoints", selectedPoints);
//     // Object.keys(selectedPoints).forEach((pointData, index) => {
//     //     let data = selectedPoints[pointData].data;
//     //     let color = selectedPoints[pointData].color;
//     //     let legendItem = legend.append("div")
//     //         .attr("class", "legendItem")
//     //         .style("color", color)
//     //         .text(`Point ${index + 1}: ${data.Name}`);
//     //     // Add click event listener to legend item
//     //     legendItem.on("click", () => {
//     //         // Remove selected point from selectedPoints object
//     //         delete selectedPoints[pointData];
//     //         // Update radar chart and legend
//     //         renderRadarChart(selectedData);
//     //         updateLegend(selectedData);
//     //         // Update scatter plot
//     //         scatter.selectAll(".dot")
//     //             .filter(d => d === selectedData)
//     //             .style("fill", null); // Remove fill color
//     //     });
//     // });


//     let legend = d3.select("#legend");
//     legend.selectAll("div").remove();

//     Object.keys(selectedPoints).forEach((pointId, index) => {
//         let pointData = selectedPoints[pointId].data;
//         let originalColor = selectedPoints[pointId].color;
//         let legendItem = legend.append("div")
//             .attr("class", "legendItem")
//             .style("color", originalColor);

//         legendItem.append("span")
//             .attr("class", "legendText")
//             .text(`Point ${index + 1}: ${pointData.Name} `);

//         legendItem.append("span")
//             .attr("class", "legendRemove")
//             .style("cursor", "pointer")
//             .text("[x]")
//             .on("click", function() {
          
//                 delete selectedPoints[pointId];
//                 //renderRadarChart(null);
//                 updateLegend();
              
//                 scatter.selectAll(".dot")
//                     .filter(function() { return d3.select(this).attr("data-id") == pointId; })
//                     .style("fill", d => colorScale(d.category)); 
//             });
//     });

// }

function radarX(radius, index) {
    return radius * Math.cos(radarAngle(index));
}

function radarY(radius, index) {
    return radius * Math.sin(radarAngle(index));
}

function radarAngle(index) {
    return radarAxesAngle * index - Math.PI / 2;
}

function initMenu(id, entries) {
    console.log("i am acalled here")
    $("select#" + id).empty();
    entries.forEach(d => {
        $("select#" + id).append("<option>" + d + "</option>");
    });
    $("#" + id).selectmenu({
        select: function () {
            let parseData = d3.select(".dataTable").datum(); 
            renderScatterplot(parseData);
        }
    });
}

function refreshMenu(id) {
    $("#" + id).selectmenu("refresh");
}

function readMenu(id) {
    return $("#" + id).val();
}

initMenu("scatterX", dimensions);
initMenu("scatterY", dimensions);
initMenu("size", dimensions);

refreshMenu("scatterX");
refreshMenu("scatterY");
refreshMenu("size");

function openPage(pageName, elmnt, color) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].style.backgroundColor = "";
    }
    document.getElementById(pageName).style.display = "block";
    elmnt.style.backgroundColor = color;
}











