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
    let radarAxesAngle;
    let dimensions = ["name", "dimension 1", "dimension 2", "dimension 3", "dimension 4", "dimension 5", "dimension 6"];
    let channels = ["scatterX", "scatterY", "size"];
    let margin, width, height, radius;
    let scatter, radar, dataTable;
    let colorScale, selectedPoints;
    let parseData; // Variable to hold the parsed data
    
    function init() {
        margin = { top: 20, right: 70, bottom: 70, left: 70 };
        width = 700;
        height = 600;
        radius = Math.min(width, height) / 2 - 50;
    
        document.getElementById("defaultOpen")?.click();
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
    
        colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        selectedPoints = [];
    
        let fileInput = document.getElementById("upload"), readFile = function () {
            clear();
            let reader = new FileReader();
            reader.onloadend = function () {
                parseData = d3.csvParse(reader.result);
                initVis(parseData);
                CreateDataTable(parseData);
                initDashboard(parseData);
            };
            reader.readAsBinaryString(fileInput.files[0]);
        };
        fileInput.addEventListener('change', readFile);
    }

    /**
     * This function initializes the visualization by setting up the axes, radar chart, data table, and scatterplot.
     * It also sets up the event listeners for the dropdown menus and the scatterplot points.
     * @param {Array} data - The data to be visualized
     * @returns {void}
     * 
     * @example
     */

    function initVis(data) {
        dimensions = Object.keys(data[0]);
        dimensions.splice(0, 1);
    
        let y = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[dimensions[0]]))
            .range([height - margin.bottom, margin.top]);
    
        let x = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[dimensions[1]]))
            .range([margin.left, width - margin.right]);
    
        yAxis = scatter.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + margin.left + ")")
            .call(d3.axisLeft(y));
    
        yAxisLabel = yAxis.append("text")
            .style("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2 + margin.top)
            .attr("y", -margin.left + 20)
            .text(dimensions[0]);
    
        xAxis = scatter.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(0, " + (height - margin.bottom) + ")")
            .call(d3.axisBottom(x));
    
        xAxisLabel = xAxis.append("text")
            .style("text-anchor", "middle")
            .attr("x", width - margin.right - 20)
            .attr("y", margin.bottom - 10)
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
    
        renderSpiderLines(data);
    
        channels.forEach(c => initMenu(c, dimensions));
        channels.forEach(c => refreshMenu(c));
    
        CreateDataTable(data);
        renderScatterplot(data);
    
        channels.forEach(c => {
            document.getElementById(c).addEventListener('change', () => renderScatterplot(data));
        });
    }
    
    function clear() {
        scatter.selectAll("*").remove();
        radar.selectAll("*").remove();
        dataTable.selectAll("*").remove();
        selectedPoints = [];
    }
    
    function CreateDataTable(data) {
        let table = dataTable.append("table").attr("class", "dataTable");
        let thead = table.append("thead");
        let tbody = table.append("tbody");
    
        let columns = Object.keys(data[0]);
        thead.append("tr").selectAll("th").data(columns).enter().append("th").text(d => d);
        
        let slicedData = data.slice(0, 100);

        let rows = tbody.selectAll("tr").data(slicedData).enter().append("tr");
        rows.selectAll("td").data(row => columns.map(column => ({ column, value: row[column] })))
            .enter().append("td").text(d => d.value);
    
        rows.on("mouseover", function () {
            d3.select(this).style("background-color", "lightgray");
        }).on("mouseout", function () {
            d3.select(this).style("background-color", "transparent");
        });
    }
    
    function renderScatterplot(data) {
        let xDomain = readMenu("scatterX");
        let yDomain = readMenu("scatterY");
        let sizeDomain = readMenu("size");
        xAxisLabel.text(xDomain);
        yAxisLabel.text(yDomain);
    
        let y = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[yDomain]))
            .range([height - margin.bottom, margin.top]);
        yAxis.transition().duration(1000).call(d3.axisLeft(y));
    
        let x = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[xDomain]))
            .range([margin.left, width - margin.right]);
        xAxis.transition().duration(1000).call(d3.axisBottom(x));
    
        yAxisLabel
            .attr("x", -height / 2 + margin.top)
            .attr("y", -margin.left + 20);
    
        xAxisLabel
            .attr("x", width - margin.right - 20)
            .attr("y", height - margin.bottom + 40);
    
        let sizeScale = d3.scaleLinear()
            .domain(d3.extent(data, d => +d[sizeDomain]))
            .range([3, 15]);
    
        scatter.selectAll(".dot").remove();
        scatter.selectAll(".dot")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "dot")
            .attr("cx", d => x(d[xDomain]))
            .attr("cy", d => y(d[yDomain]))
            .attr("r", d => sizeScale(d[sizeDomain]))
            .style("fill", d => selectedPoints.includes(d) ? colorScale(selectedPoints.indexOf(d)) : "black")
            .on("click", function (event, d) {
                if (selectedPoints.includes(d)) {
                    selectedPoints = selectedPoints.filter(point => point !== d);
                } else {
                    if (selectedPoints.length < 5) {
                        selectedPoints.push(d);
                    } else {
                        alert("You can select a maximum of 5 points.");
                    }
                }
                renderScatterplot(data);
                updateRadarChart();
                updateLegend();
            });
    }
    
    function renderRadarChart() {
        radar.selectAll(".selectedRadarLine").remove();
    
        let maxValues = {};
        dimensions.forEach(dim => {
            maxValues[dim] = d3.max(parseData, d => +d[dim]);
        });
    
        let r = d3.scaleOrdinal()
            .domain([0, d3.max(Object.values(maxValues))])
            .range([0, radius]);
    
        let radarLine = d3.lineRadial()
            .radius(d => r(d.value))
            .angle((d, i) => radarAngle(i))
            .curve(d3.curveBasisClosed);
    
        selectedPoints.forEach((d, i) => {
            let radarData = dimensions.map((key, index) => ({
                angle: radarAngle(index),
                value: +d[key]
            }));
    
            radar.append("path")
                .datum(radarData)
                .attr("class", "selectedRadarLine")
                .attr("d", radarLine)
                .style("fill", "none")
                .style("stroke", colorScale(i))
                .style("stroke-width", 3)
                .style("opacity", 1);
        });
    }
    
    function renderSpiderLines(data) {
        let levels = 6;
        let web = radar.append("g").attr("class", "web");
    
        let maxValues = {};
        dimensions.forEach(dim => {
            maxValues[dim] = d3.max(data, d => +d[dim]);
        });
    
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
        renderRadarChart();
    }
    
    function updateLegend() {
        let legend = d3.select("#legend");
        legend.selectAll("div").remove();
    
        selectedPoints.forEach((d, i) => {
            let legendItem = legend.append("div")
                .attr("class", "legendItem")
                .style("display", "flex")
                .style("align-items", "center");
    
            legendItem.append("span")
                .style("background-color", colorScale(i))
                .style("display", "inline-block")
                .style("width", "10px")
                .style("height", "10px")
                .style("border-radius", "50%")
                .style("margin-right", "5px");
    
            legendItem.append("span")
                .text(d.Name);
    
            legendItem.append("button")
                .text("x")
                .style("margin-left", "10px")
                .style("background", "none")
                .style("border", "1px solid black")
                .style("border-radius", "3px")
                .style("padding", "2px 5px")
                .style("cursor", "pointer")
                .on("click", function() {
                    selectedPoints = selectedPoints.filter(point => point !== d);
                    renderScatterplot(parseData);
                    updateRadarChart();
                    updateLegend();
                });
        });
    }
    
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
        let menu = document.getElementById(id);
        menu.innerHTML = '';
        entries.forEach(d => {
            let option = document.createElement('option');
            option.text = d;
            option.value = d;
            menu.add(option);
        });
    
        menu.addEventListener('change', function() {
            renderScatterplot(parseData);
        });
    }
    
    function refreshMenu(id) {
        let menu = document.getElementById(id);
        menu.dispatchEvent(new Event('change'));
    }
    
    function readMenu(id) {
        let menu = document.getElementById(id);
        return menu.value;
    }
    
    channels.forEach(c => initMenu(c, dimensions));
    channels.forEach(c => refreshMenu(c));
    
    init();
    