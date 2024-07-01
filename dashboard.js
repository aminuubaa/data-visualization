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

// TODO: File for Part 2
// TODO: You can edit this file as you wish - add new methods, variables etc. or change/delete existing ones.

// TODO: use descriptive names for variables
let chart1, chart2, chart3, chart4;
let country;
let parsedata_backup;

function initDashboard(parseData) {
    width = 800
    height = 600
    parsedata_backup = parseData
    chart1 = d3.select("#chart1").append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", "0 0 800 600")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .call(d3.zoom().on("zoom", function (event) {
            chart1.attr("transform", event.transform);
        }))
        .append("g");

    chart2 = d3.select("#chart2").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    chart3 = d3.select("#chart3").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    chart4 = d3.select("#chart4").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    console.log("pasring data", parseData)

    createChart4("Deaths", parseData);
    createChart3(parseData);
    createChart1(parseData);
    createChart2(parseData);
    createChart3(parseData);
    createChart4(parseData);
}


function createChart1(parseData) {
    const width = 960; // Adjust width if necessary
    const height = 600; // Adjust height if necessary

    const projection = d3.geoMercator()
        .scale(150)
        .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection);

    const tooltip = d3.select("body").append("div")
        .attr("id", "tooltip")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("width", "120px")
        .style("height", "auto")
        .style("padding", "5px")
        .style("font", "12px sans-serif")
        .style("background", "lightsteelblue")
        .style("border", "0px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    let selectedCountryPath = null; // Track the currently selected country path

    // Aggregate data by country
    const dataByCountry = d3.rollups(
        parseData,
        v => ({
            confirmed: d3.sum(v, d => d.Confirmed),
            deaths: d3.sum(v, d => d.Deaths),
            recovered: d3.sum(v, d => d.Recovered),
            active: d3.sum(v, d => d.Active)
        }),
        d => d.Country
    );

    const countryDataMap = new Map(dataByCountry);

    const countries = Array.from(countryDataMap.keys());
    const confirmedValues = countries.map(country => countryDataMap.get(country).deaths);
    const maxConfirmed = d3.max(confirmedValues);
    const minConfirmed = d3.min(confirmedValues);

    const colorScale = d3.scaleSequential(d3.interpolateOranges)
        .domain([minConfirmed, maxConfirmed]);

    // Load external geojson data and create the map
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson").then(function (geojson) {
        const countryPaths = chart1.selectAll("path")
            .data(geojson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "country-path")
            .attr("stroke", "black") // Stroke color for borders
            .attr("stroke-width", 0.5) // Stroke width for borders
            .attr("fill", d => {
                const countryData = countryDataMap.get(d.properties.name);
                return countryData ? colorScale(countryData.confirmed) : "#ccc";
            })
            .on("mouseover", function (event, d) {
                if (selectedCountryPath !== this) {
                    d3.select(this)
                        .attr("fill", "orange"); // Example of hover effect: change fill color to orange

                    const countryData = countryDataMap.get(d.properties.name);
                    tooltip.transition().duration(200).style("opacity", .9);
                    tooltip.html(countryData ? `${d.properties.name}<br>Confirmed: ${countryData.confirmed}<br>Deaths: ${countryData.deaths}<br>Recovered: ${countryData.recovered}<br>Active: ${countryData.active}` : `${d.properties.name}<br>No data`)
                        .style("left", (event.pageX) + "px")
                        .style("top", (event.pageY - 28) + "px");
                }
            })
            .on("mouseout", function () {
                if (selectedCountryPath !== this) {
                    d3.select(this)
                        .attr("fill", d => {
                            const countryData = countryDataMap.get(d.properties.name);
                            return countryData ? colorScale(countryData.confirmed) : "#ccc";
                        });

                    tooltip.transition().duration(500).style("opacity", 0);
                }
            })
            .on("click", function (event, d) {
                if (selectedCountryPath) {
                    // Reset previously selected country path
                    d3.select(selectedCountryPath)
                        .attr("fill", d => {
                            const countryData = countryDataMap.get(d.properties.name);
                            return countryData ? colorScale(countryData.confirmed) : "#ccc";
                        });
                }

                // Set the current selection
                selectedCountryPath = this;

                // Highlight the clicked country path
                d3.select(this)
                    .attr("fill", "red")
                    .transition()
                    .duration(500)
                    .attr("fill", "red");

                country = d.properties.name;
                createChart2(d.properties.name, parseData);
                createChart4(d.properties.name, parseData);

            });
        geojson.features.forEach(feature => {
            const countryName = feature.properties.name;
            const countryData = countryDataMap.get(countryName);
            if (countryData && countryData.confirmed > 100000) {
                const [cx, cy] = path.centroid(feature); // Get the centroid of the country path
                const radius = Math.sqrt(countryData.confirmed) / 500; // Adjusted to make bubbles smaller

                chart1.append("circle")
                    .attr("cx", cx)
                    .attr("cy", cy)
                    .attr("r", 0)
                    .style("fill", "rgba(255, 0, 0, 0.5)") // Adjust bubble color and opacity
                    .transition()
                    .duration(500)
                    .attr("r", radius);
            }
        });
        // Append a rectangle to act as background color
        chart1.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#e6f2ff")
            .lower(); // Place the rectangle behind other elements

        // Filtering
        const filterMenu = d3.select("body").append("select")
            .attr("id", "filterMenu")
            .on("change", function () {
                const selectedCountry = d3.select(this).property("value");
                countryPaths.attr("display", d => {
                    if (selectedCountry === "All" || d.properties.name === selectedCountry) {
                        return "block";
                    } else {
                        return "none";
                    }
                });
            });

        filterMenu.append("option").attr("value", "All").text("All");
        countries.forEach(country => {
            filterMenu.append("option").attr("value", country).text(country);
        });

        // Add legend to the legend container
        // Create legend container


        const legendContainer = d3.select("#legend-container")
        const legend = legendContainer.append("svg")
            .attr("width", 200)
            .attr("height", 300);
        const legendScale = d3.scaleLinear()
            .domain([minConfirmed, maxConfirmed])
            .range([180, 0]); // Invert range for vertical layout

        // Create legend axis
        const legendAxis = d3.axisRight(legendScale)
            .ticks(5); // Adjust number of ticks as needed

        // Append legend axis
        legend.append("g")
            .attr("transform", "translate(190, 10)") // Adjust position as needed
            .call(legendAxis);

        // Add legend label
        legend.append("text")
            .attr("x", 10)
            .attr("y", 0)
            .attr("dy", "-0.5em")
            .text("Confirmed Cases");

        // Add color gradient to legend
        const defs = legend.append("defs");

        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");

        linearGradient.selectAll("stop")
            .data(colorScale.ticks().map((t, i, n) => ({
                offset: `${100 * i / n.length}%`,
                color: colorScale(t)
            })))
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        legend.append("rect")
            .attr("x", 10)
            .attr("y", 10)
            .attr("width", 10)
            .attr("height", 180)
            .style("fill", "url(#linear-gradient)");

        // Adjust legend scale ticks
        legend.append("g")
            .attr("transform", "translate(20, 10)")
            .call(legendAxis);


    });
}

function getCountryData(country, data) {

    const parseDate = d3.timeParse("%m/%d/%Y");

    // Filter data for the specified country
    let filteredData = null;

if (!country || country.length === 0) {
    console.error("No data available for the selected country.", data);
    filteredData = data;
} else {
    filteredData = data.filter(d => d.Country === country);
}
     

    // Create an array to hold aggregated monthly data
    const monthlyData = [];

    // Group data by year first
    const dataByYear = d3.group(filteredData, d => parseDate(d.Date).getFullYear());

    // Iterate through each year's data
    dataByYear.forEach((yearData, year) => {
        // Group data by month within the current year
        const dataByMonth = d3.group(yearData, d => parseDate(d.Date).getMonth());

        // Iterate through each month within the current year
        dataByMonth.forEach((monthData, month) => {
            // Aggregate values for the current month in the current year
            const aggregatedData = {
                date: new Date(year, month, 1), // Use the 1st day of the month as the date
                confirmed: d3.sum(monthData, d => +d.Confirmed),
                deaths: d3.sum(monthData, d => +d.Deaths),
                recovered: d3.sum(monthData, d => +d.Recovered),
                active: d3.sum(monthData, d => +d.Active)
            };

            monthlyData.push(aggregatedData);
        });
    });

    return monthlyData;
}




function createChart2(country, data) {

    const countryData = getCountryData(country, data);

   

    console.log("countr data in the chart 2 function is", countryData)
    const margin = { top: 50, right: 50, bottom: 100, left: 50 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Clear previous chart
    chart2.selectAll("*").remove();

    const svg = chart2.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Extract the dates from your data
    const dates = countryData.map(d => d.date);

    const xScale = d3.scalePoint() // Using scalePoint for discrete dates
        .domain(dates)
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(countryData, d => d.confirmed)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.confirmed));

    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    // Add additional lines for deaths, recovered, and active cases
    const lineDeaths = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.deaths));

    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 1.5)
        .attr("d", lineDeaths);

    const lineRecovered = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.recovered));

    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 1.5)
        .attr("d", lineRecovered);

    const lineActive = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.active));

    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 1.5)
        .attr("d", lineActive);

    // Add axes
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%Y-%m-%d"))); // Format the dates here

    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 50)
        .attr("text-anchor", "middle")
        .text("Date");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .text("Confirmed Cases");

    // Add legend
    const legendData = [
        { name: "Confirmed", color: "steelblue" },
        { name: "Deaths", color: "red" },
        { name: "Recovered", color: "green" },
        { name: "Active", color: "orange" }
    ];

    const legend = svg.append("g")
        .attr("transform", `translate(${width - 100}, ${margin.top})`);

    legend.selectAll("rect")
        .data(legendData)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => d.color);

    legend.selectAll("text")
        .data(legendData)
        .enter()
        .append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 10)
        .text(d => d.name);
}



function createChart3(parseData) {
    const margin = { top: 50, right: 150, bottom: 100, left: 100 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const groupedData = d3.groups(parseData, d => d.Date);

    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleBand().range([0, height]).padding(0.1);

    // Remove any previous SVG containers
    d3.select("#chart3").selectAll("*").remove();

    const svg = d3.select("#chart3").append("svg")
    const svg = d3.select("#chart3").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    let currentIndex = 0;
    let interval;
    const speed = 1000;
    let startIndex = 0;
    let endIndex = groupedData.length - 1;

    function update(date) {
        const attribute = d3.select("#race-bar-category").node().value;
        const data = groupedData.find(d => d[0] === date)[1];
        const top20Data = data.sort((a, b) => b[attribute] - a[attribute]).slice(0, 20);

        xScale.domain([0, d3.max(top20Data, d => +d[attribute])]);
        xScale.domain([0, d3.max(top20Data, d => +d[attribute])]);
        yScale.domain(top20Data.map(d => d.Country));

        // Remove empty containers
        svg.selectAll("*").remove();

        // Remove empty containers
        svg.selectAll("*").remove();

        const bars = svg.selectAll(".bar")
            .data(top20Data, d => d.Country);

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", 0)
            .attr("y", d => yScale(d.Country))
            .attr("width", d => xScale(d[attribute]))
            .attr("width", d => xScale(d[attribute]))
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.Country))
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 1);
                showTooltip(d.Country, event);
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.7);
                hideTooltip();
            });

        bars.transition().duration(speed)
            .attr("y", d => yScale(d.Country))
            .attr("width", d => xScale(d[attribute]));
            .attr("width", d => xScale(d[attribute]));

        bars.exit().remove();

        const labels = svg.selectAll(".label")
            .data(top20Data, d => d.Country);

        labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d[attribute]) + 5)
            .attr("x", d => xScale(d[attribute]) + 5)
            .attr("y", d => yScale(d.Country) + yScale.bandwidth() / 2 + 5)
            .text(d => `${d.Country}: ${d[attribute]}`);
            .text(d => `${d.Country}: ${d[attribute]}`);

        labels.transition().duration(speed)
            .attr("x", d => xScale(d[attribute]) + 5)
            .attr("y", d => yScale(d.Country) + yScale.bandwidth() / 2 + 5)
            .text(d => `${d.Country}: ${d[attribute]}`);
            .text(d => `${d.Country}: ${d[attribute]}`);

        labels.exit().remove();

        const dateLabel = svg.selectAll(".dateLabel")
            .data([date]);

        dateLabel.enter()
            .append("text")
            .attr("class", "dateLabel")
            .attr("x", width - 100)
            .attr("y", height - 30)
            .attr("font-size", "24px")
            .attr("fill", "#333")
            .text(d => d);

        dateLabel.transition().duration(speed)
            .text(d => d);

        dateLabel.exit().remove();

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(xScale).ticks(5));

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale).tickSize(0).tickFormat(""));
    }

    function startRace() {
        interval = setInterval(() => {
            update(groupedData[currentIndex][0]);
            currentIndex++;
            if (currentIndex > endIndex) {
                clearInterval(interval);
            }
        }, speed);
    }

    function stopRace() {
        clearInterval(interval);
    }

    function resetRace() {
        stopRace();
        currentIndex = startIndex;
        update(groupedData[currentIndex][0]);
        d3.select("#play-button").text("Play");
    }

    function showTooltip(country, event) {
        tooltip.transition().duration(200).style("opacity", .9);
        tooltip.html(country)
            .style("left", (event.pageX + 5) + "px")
            .style("top", (event.pageY - 28) + "px");
    }

    function hideTooltip() {
        tooltip.transition().duration(500).style("opacity", 0);
    }

    // Add play button
    d3.select("#play-button")
        .on("click", function() {
            if (d3.select(this).text() === "Play") {
                d3.select(this).text("Pause");
                startRace();
            } else {
                d3.select(this).text("Play");
                stopRace();
            }
        });

    // Add reset button
    d3.select("#reset-button")
        .on("click", resetRace);

    // Add 'From' date picker
    d3.select("#from-date")
        .on("change", function() {
            const selectedDate = new Date(this.value);
            startIndex = groupedData.findIndex(d => new Date(d[0]) >= selectedDate);
            if (startIndex === -1) startIndex = 0;
            if (startIndex > endIndex) {
                endIndex = startIndex;
                d3.select("#to-date").property("value", groupedData[endIndex][0]);
            }
            currentIndex = startIndex;
            update(groupedData[currentIndex][0]);
        });

    // Add 'To' date picker
    d3.select("#to-date")
        .on("change", function() {
            const selectedDate = new Date(this.value);
            endIndex = groupedData.findIndex(d => new Date(d[0]) >= selectedDate);
            if (endIndex === -1) endIndex = groupedData.length - 1;
            if (endIndex < startIndex) {
                startIndex = endIndex;
                d3.select("#from-date").property("value", groupedData[startIndex][0]);
            }
            currentIndex = startIndex;
            update(groupedData[currentIndex][0]);
        });

    // Set initial values for date pickers
    d3.select("#from-date").property("value", groupedData[startIndex][0]);
    d3.select("#to-date").property("value", groupedData[endIndex][0]);

    // Initial call to update with the first date
    update(groupedData[0][0]);
}


function createChart4(parseData) {
    const margin = { top: 50, right: 150, bottom: 50, left: 100 };
    const width = 460 - margin.left + margin.right;
    const height = 400 - margin.top + margin.bottom;

    const aggregatedData = d3.groups(parseData, d => d.Date, d => d.Country)
        .map(([date, countries]) => {
            const entry = { date: new Date(date) };
            countries.forEach(([country, values]) => {
                entry[country] = d3.sum(values, d => d.Confirmed);
            });
            return entry;
        });

    const countryTotals = d3.rollups(parseData, v => d3.sum(v, d => d.Confirmed), d => d.Country)
        .sort(([, a], [, b]) => d3.descending(a, b))
        .slice(0, 10)
        .map(([country]) => country);

    const filteredData = aggregatedData.map(d => {
        const entry = { date: d.date };
        countryTotals.forEach(country => {
            entry[country] = d[country] || 0;
        });
        return entry;
    });

    d3.select("#chart4").selectAll("*").remove();

    const svg = d3.select("#chart4")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleTime()
        .domain(d3.extent(filteredData, d => d.date))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d3.sum(countryTotals, country => d[country]))])
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(countryTotals)
        .range(d3.schemeCategory10);

    const stack = d3.stack()
        .keys(countryTotals)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(filteredData);

    const area = d3.area()
        .x(d => x(d.data.date))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("opacity", 0)
        .style("background", "lightsteelblue")
        .style("padding", "5px")
        .style("border-radius", "8px")
        .style("pointer-events", "none");

    svg.selectAll("path")
        .data(stackedData)
        .enter().append("path")
        .attr("class", d => `stackedArea ${d.key.replace(/\s+/g, '')}`)
        .attr("fill", d => color(d.key))
        .attr("d", area)
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", .9);
            tooltip.html(d.key)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        });

    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(5));

    svg.append("g")
        .call(d3.axisLeft(y));

    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    countryTotals.forEach((country, index) => {
        legend.append("rect")
            .attr("x", 0)
            .attr("y", index * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color(country));

        legend.append("text")
            .attr("x", 20)
            .attr("y", index * 20 + 10)
            .text(country);
    });
}


// clear files if changes (dataset) occur
function clearDashboard() {
    chart1.selectAll("*").remove();
    chart2.selectAll("*").remove();
    chart3.selectAll("*").remove();
    chart4.selectAll("*").remove();
}

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


document.addEventListener('DOMContentLoaded', function () {


    document.querySelectorAll('input[name="data-type"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const selectedMetric = this.value;
            const selectedCountry = country
            console.log("ccccc")
            createChart4(selectedCountry, parsedata_backup);
        });
    });
});