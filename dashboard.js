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
let parseDataChart4;

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
        .attr("width", width + 100)
        .attr("height", height)
        .append("g");


    chart4 = d3.select("#chart4").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    chart5 = d3.select("#chart5").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    console.log("pasring data", parseData)

    parseDataChart4 = parseData
    // createChart4("Deaths", parseData);
    createChart4("None", parseData);
    createChart3(parseData);
    createChart1(parseData);
    //createChart2(null, parseData);
    createChart5(null, parseData);
    CreateWidgets(parseData);

}


function createChart1(parseData) {
    const width = 800; // Adjust width if necessary
    const height = 700; // Adjust height if necessary

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
                //createChart2(d.properties.name, parseData);
                createChart5(d.properties.name, parseData);
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
                    .style("fill", "#008001") // Adjust bubble color and opacity
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

        // Add legend to the legend container
        // Create legend container


        const legendContainer = d3.select("#legend-container")
        const legend = legendContainer.append("svg")
            .attr("width", 100)
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
            .attr("y", 15)
            .attr("dy", "0.5em")
            .text("Cases");

        // Add color gradient to legend
        const defs = legend.append("defs");

        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "100%")
            .attr("x2", "0%")
            .attr("y2", "0%");

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
            .attr("y", 50)
            .attr("width", 10)
            .attr("height", 180)
            .style("fill", "url(#linear-gradient)");

        // Adjust legend scale ticks
        legend.append("g")
            .attr("transform", "translate(20, 50)")
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
        document.getElementById("spnChart2").innerHTML = "for " + country;
       
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

    document.getElementById("spnChart2").innerHTML="dsdfsdf";

    console.log("countr data in the chart 2 function is", countryData)
    const margin = { top: 50, right: 50, bottom: 100, left: 100 };
    const width = 900 - margin.left - margin.right;
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
        .text("Cases");

    // Add legend
    const legendData = [
        { name: "Confirmed", color: "steelblue" },
        { name: "Deaths", color: "red" },
        { name: "Recovered", color: "green" },
        { name: "Active", color: "orange" }
    ];

    const legend = svg.append("g")
        .attr("transform", `translate(${5}, ${margin.top - 50})`);

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
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    let currentIndex = 0;
    let interval;
    const speed = 100;
    let startIndex = 0;
    let endIndex = groupedData.length - 1;

    function update(date) {
        const attribute = d3.select("#race-bar-category").node().value;
        const data = groupedData.find(d => d[0] === date)[1];
        const top20Data = data.sort((a, b) => b[attribute] - a[attribute]).slice(0, 20);

        xScale.domain([0, d3.max(top20Data, d => +d[attribute])]);
        yScale.domain(top20Data.map(d => d.Country));

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

        bars.exit().remove();

        const labels = svg.selectAll(".label")
            .data(top20Data, d => d.Country);

        labels.enter()
            .append("text")
            .attr("class", "label")
            .attr("x", d => xScale(d[attribute]) + 5)
            .attr("y", d => yScale(d.Country) + yScale.bandwidth() / 2 + 5)
            .text(d => `${d.Country}: ${d[attribute]}`);

        labels.transition().duration(speed)
            .attr("x", d => xScale(d[attribute]) + 5)
            .attr("y", d => yScale(d.Country) + yScale.bandwidth() / 2 + 5)
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

function createChart4(selectedCountry, parseData) {

    const margin = { top: 20, right: 30, bottom: 30, left: 120 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    chart4.selectAll("*").remove();

    const svg = chart4.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let metric;
    const selectedMetric = document.querySelector('input[name="data-type"]:checked').value;
    if (selectedMetric === "Active") {
        metric = "Active";
    } else if (selectedMetric === "Confirmed") {
        metric = "Confirmed";
    } else {
        metric = "Deaths"; 
    }

    let topCountries;
    if (selectedCountry === null) {
        topCountries = Array.from(d3.rollup(
            parseData,
            v => d3.max(v, d => +d[metric]),  // Use max to determine top countries by peak metric value
            d => d.Country
        )).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0]);
    } else {
        topCountries = Array.from(new Set([...[selectedCountry], ...Array.from(d3.rollup(
            parseData,
            v => d3.max(v, d => +d[metric]),  // Use max to determine top countries by peak metric value
            d => d.Country
        )).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0])]));
    }

    // Filter and sort the data
    const filteredData = parseData
        .filter(d => topCountries.includes(d.Country))
        .sort((a, b) => d3.ascending(new Date(a.Date), new Date(b.Date)));

   
    // Fill missing dates for each country
    const formatMillions = d3.format(".2s");
    const dateSet = new Set(filteredData.map(d => d3.timeFormat("%Y-%m-%d")(d3.timeParse("%m/%d/%Y")(d.Date))));
    const allDates = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

    const structuredData = {};
    allDates.forEach(date => {
        structuredData[date] = { day: date };
        topCountries.forEach(country => {
            const entry = filteredData.find(d => d3.timeFormat("%Y-%m-%d")(d3.timeParse("%m/%d/%Y")(d.Date)) === date && d.Country === country);
            structuredData[date][country] = entry ? +entry[metric] : 0;
        });
    });

    const data = Object.values(structuredData);

    console.log("prepared data for the chart is ",data)

    // Step 4: Create scales
    const x = d3.scaleTime()
        .domain(d3.extent(allDates, d => new Date(d)))
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => {
            const sum = d3.sum(topCountries, key => {
                return d[key];
            });
            return sum;
        })])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(topCountries)
        .range(d3.schemeCategory10);

    // Step 5: Create stack layout
    const stack = d3.stack()
        .keys(topCountries)
        .order(d3.stackOrderAscending)
        .offset(d3.stackOffsetNone);

    const stackedData = stack(data);

    // Step 6: Create area generator
    const area = d3.area()
        .x(d => x(new Date(d.data.day)))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    // Step 7: Add areas to the chart
    svg.selectAll(".layer")
        .data(stackedData)
        .enter().append("path")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .attr("d", area);

    // Step 8: Add axes
    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).ticks(d3.timeMonth.every(1)).tickFormat(d3.timeFormat("%b %d"))); // Change tick interval to every month

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y).tickFormat(d => formatMillions(d)));

    // Step 9: Add legend
    const legend = svg.append("g")
        .attr("transform", "translate(-100, 0)"); // Adjust position for the left side

    legend.selectAll("rect")
        .data(topCountries)
        .enter().append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d));

    legend.selectAll("text")
        .data(topCountries)
        .enter().append("text")
        .attr("x", 15)
        .attr("y", (d, i) => i * 20 + 10)
        .attr("dy", "0.35em")
        .text(d => d)
        .style("text-transform", "capitalize");

    // Step 10: Add tooltip div
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    // Step 11: Add focus group for circle and text
    const focus = svg.append("g")
        .attr("class", "focus")
        .style("display", "none");

    focus.append("circle")
        .attr("fill","#7F2703")
        .attr("r", 8.5);

    focus.append("text")
        .attr("x", 9)
        .attr("dy", ".35em");

    // Step 12: Add overlay for capturing mouse movements
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("opacity", 0)
        .on("mouseover", () => focus.style("display", null))
        .on("mouseout", () => {
            focus.style("display", "none");
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("mousemove", mousemove);

        function mousemove(event) {
            const bisectDate = d3.bisector(d => new Date(d.day)).left;
            const x0 = x.invert(d3.pointer(event)[0]);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - new Date(d0.day) > new Date(d1.day) - x0 ? d1 : d0;
        
            focus.attr("transform", `translate(${x(new Date(d.day))},${y(d[topCountries[0]])})`);
            focus.select("text").text(d3.timeFormat("%b %d")(new Date(d.day)));
        
            let tooltipHtml = `Date: ${d3.timeFormat("%b %d, %Y")(new Date(d.day))}<br>`;
            topCountries.forEach(country => {
                tooltipHtml += `${country}: ${formatMillions(d[country])}<br>`;
            });
        
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(tooltipHtml)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        }

    // Optional: Log for debugging
    console.log("structured data for stacked area chart is", data);
}



function createChart4t(selectedCountry, parseData) {


    const margin = { top: 20, right: 30, bottom: 30, left: 120 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Clear previous chart
    chart4.selectAll("*").remove();

    const svg = chart4.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Determine the metric based on the selected radio button
    let metric;
    const selectedMetric = document.querySelector('input[name="data-type"]:checked').value;
    if (selectedMetric === "Active") {
        metric = "Active";
    } else if (selectedMetric === "Confirmed") {
        metric = "Confirmed";
    } else {
        metric = "Deaths"; // Default to Deaths if nothing selected
    }

    // Step 1: Determine the top 5 countries by the selected metric
    let topCountries;
    if (selectedCountry === null) {
        topCountries = Array.from(d3.rollup(
            parseData,
            v => d3.sum(v, d => +d[metric]),
            // v => d3.sum(v, d => +d["None"]),
            d => d.Country
        )).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0]);
        console.log("selectedCountry === null", selectedCountry, topCountries)
    } else {
        topCountries = Array.from(new Set([...[selectedCountry], ...Array.from(d3.rollup(
            parseData,
            v => d3.sum(v, d => +d[metric]),
            d => d.Country
        )).sort((a, b) => b[1] - a[1]).slice(0, 5).map(d => d[0])]));
        console.log("selectedCountry", selectedCountry, topCountries)
    }

    // Step 2: Aggregate data by month for top 5 countries
    const dataByMonth = d3.rollups(
        parseData.filter(d => topCountries.includes(d.Country)),
        v => {
            const countryData = {};
            topCountries.forEach(country => {
                countryData[country] = d3.sum(v.filter(d => d.Country === country), d => +d[metric]);
            });
            return countryData;
        },
        d => d3.timeFormat("%b %Y")(d3.timeParse("%m/%d/%Y")(d.Date))
    );

    // Step 3: Format data into array suitable for D3 stacked area chart
    const data = dataByMonth.map(([month, countryData]) => ({
        month: month,
        ...countryData
    }));

    console.log("top countries", topCountries)
    const keys = topCountries;

    const x = d3.scaleBand()
        .domain(data.map(d => d.month))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.sum(keys, key => d[key]))])
        .nice()
        .range([height, 0]);

    const color = d3.scaleOrdinal()
        .domain(keys)
        .range(d3.schemeCategory10);

    const stack = d3.stack()
        .keys(keys)
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);

    const area = d3.area()
        .x(d => x(d.data.month) + x.bandwidth() / 2)
        .y0(d => y(d[0]))
        .y1(d => y(d[1]));

    const stackedData = stack(data);

    svg.selectAll(".layer")
        .data(stackedData)
        .enter().append("path")
        .attr("class", "layer")
        .attr("fill", d => color(d.key))
        .attr("d", area);

    svg.append("g")
        .attr("class", "axis x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    svg.append("g")
        .attr("class", "axis y-axis")
        .call(d3.axisLeft(y));

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width}, 0)`);

    keys.forEach((key, i) => {
        const legendRow = legend.append("g")
            .attr("transform", `translate(0, ${i * 20})`);

        legendRow.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color(key));

        legendRow.append("text")
            .attr("x", -10)
            .attr("y", 10)
            .attr("text-anchor", "end")
            .style("text-transform", "capitalize")
            .text(key);
    });
}


function createChart5(country, data) {
    // Set dimensions and margins
    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const width = 900 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    const parseTime = d3.timeParse("%m/%d/%Y");

    // Parse the date / time
    if (country) {
        data = data.filter(d => d.Country === country);
    }

    // Clear previous chart
    d3.select("#chart5").selectAll("*").remove();

    // Convert data fields to appropriate types and aggregate if country is null
    const aggregatedData = {};
    data.forEach(d => {
        const date = parseTime(d.Date);
        const confirmed = +d.Confirmed;
        const deaths = +d.Deaths;
        const recovered = +d.Recovered;

        if (!aggregatedData[date]) {
            aggregatedData[date] = {
                date: date,
                confirmed: confirmed,
                deaths: deaths,
                recovered: recovered
            };
        } else {
            aggregatedData[date].confirmed += confirmed;
            aggregatedData[date].deaths += deaths;
            aggregatedData[date].recovered += recovered;
        }
    });

    // Convert aggregated data object to array for D3
    const preparedData = Object.values(aggregatedData);

    // Sort data by date
    preparedData.sort((a, b) => a.date - b.date);

    // Set the ranges
    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    // Define the lines
    const valuelineConfirmed = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.confirmed));

    const valuelineDeaths = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.deaths));

    const valuelineRecovered = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.recovered));

    // Append the svg object to the body of the page
    const svg = d3.select("#chart5").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scale the range of the data
    x.domain(d3.extent(preparedData, d => d.date));
    y.domain([0, d3.max(preparedData, d => Math.max(d.confirmed, d.deaths, d.recovered))]);

    // Add the valueline path for confirmed cases
    svg.append("path")
        .data([preparedData])
        .attr("class", "line")
        .style("stroke", "blue")
        .attr("d", valuelineConfirmed);

    // Add the valueline path for death cases
    svg.append("path")
        .data([preparedData])
        .attr("class", "line")
        .style("stroke", "red")
        .attr("d", valuelineDeaths);

    // Add the valueline path for recovered cases
    svg.append("path")
        .data([preparedData])
        .attr("class", "line")
        .style("stroke", "green")
        .attr("d", valuelineRecovered);

    // Add points for confirmed cases
    svg.selectAll("dot")
        .data(preparedData)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.confirmed))
        .style("fill", "blue");

    // Add points for death cases
    svg.selectAll("dot")
        .data(preparedData)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.deaths))
        .style("fill", "red");

    // Add points for recovered cases
    svg.selectAll("dot")
        .data(preparedData)
        .enter().append("circle")
        .attr("r", 5)
        .attr("cx", d => x(d.date))
        .attr("cy", d => y(d.recovered))
        .style("fill", "green");

    // Add the X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Add the Y Axis
    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => {
            if (d >= 1000) {
                return `${d / 1000}K`;
            }
            return d;
        }));

    // Add tooltip
    const tooltip = d3.select("#tooltip-info");

    // Create focus elements for each line
    const focusConfirmed = svg.append("g")
        .style("display", "none");

    focusConfirmed.append("circle")
        .attr("r", 10)
        .style("fill", "#7F2703");

    const focusDeaths = svg.append("g")
        .style("display", "none");

    focusDeaths.append("circle")
        .attr("r", 10)
        .style("fill", "#7F2703");

    const focusRecovered = svg.append("g")
        .style("display", "none");

    focusRecovered.append("circle")
        .attr("r", 10)
        .style("fill", "#7F2703");

    // Create an overlay to capture mouse movements
    svg.append("rect")
        .attr("class", "overlay")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "all")
        .on("mouseover", () => {
            tooltip.style("visibility", "visible");
            focusConfirmed.style("display", null);
            focusDeaths.style("display", null);
            focusRecovered.style("display", null);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
            focusConfirmed.style("display", "none");
            focusDeaths.style("display", "none");
            focusRecovered.style("display", "none");
        })
        .on("mousemove", mousemove);

    function mousemove(event) {
        const bisectDate = d3.bisector(d => d.date).left;
        const x0 = x.invert(d3.pointer(event)[0]);
        const i = bisectDate(preparedData, x0, 1);
        const d0 = preparedData[i - 1];
        const d1 = preparedData[i];
        const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

        focusConfirmed.attr("transform", `translate(${x(d.date)},${y(d.confirmed)})`);
        focusDeaths.attr("transform", `translate(${x(d.date)},${y(d.deaths)})`);
        focusRecovered.attr("transform", `translate(${x(d.date)},${y(d.recovered)})`);

        tooltip.html(`Date: ${d3.timeFormat("%Y-%m-%d")(d.date)}<br/>Confirmed: ${d.confirmed}<br/>Deaths: ${d.deaths}<br/>Recovered: ${d.recovered}`)
            .style("left", `${event.pageX + 15}px`)
            .style("top", `${event.pageY - 35}px`);
    }

    // Add legends
    const legendData = [
        { color: "blue", text: "Confirmed" },
        { color: "red", text: "Deaths" },
        { color: "green", text: "Recovered" }
    ];

    const legend = svg.selectAll(".legend")
        .data(legendData)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(10,${i * 20})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", d => d.color);

    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d.text);

    // Apply CSS for axis text
    d3.selectAll(".x-axis text")
        .style("font-size", "14px")
        .style("font-weight", "bold");

    d3.selectAll(".y-axis text")
        .style("font-size", "14px")
        .style("font-weight", "bold");
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
            console.log("hello", radio.id, country)
            const selectedMetric = this.value;
            const selectedCountry = country
            if (!!selectedCountry) {
                createChart4(selectedCountry, parsedata_backup);
            } else {
                createChart4("None", parsedata_backup);
            }
        });
    });
});


function CreateWidgets(parsedData) {
    // Aggregate the global totals
    const globalTotal = parsedData.reduce((acc, data) => {
        acc.confirmed += parseInt(data.Confirmed) || 0;
        acc.active += parseInt(data.Active) || 0;
        acc.recovered += parseInt(data.Recovered) || 0;
        acc.deaths += parseInt(data.Deaths) || 0;
        return acc;
    }, { confirmed: 0, active: 0, recovered: 0, deaths: 0 });

    // Logging the global totals to debug
    console.log('Global Total:', globalTotal);

    // Create the widget data
    const widgetData = [
        { id: "confirmed", label: "Total Confirmed", value: globalTotal.confirmed, color: "#007bff" },
        { id: "active", label: "Total Active", value: globalTotal.active, color: "#ffc107" },
        { id: "recovered", label: "Total Recovered", value: globalTotal.recovered, color: "#28a745" },
        { id: "deaths", label: "Total Deaths", value: globalTotal.deaths, color: "#dc3545" }
    ];

    const widgetContainer = d3.select("#widgets");

    // Remove any existing widgets
    widgetContainer.selectAll(".widget").remove();

    // Add new widgets
    widgetContainer.selectAll(".widget")
        .data(widgetData)
        .enter()
        .append("div")
        .attr("class", "widget")
        .style("border-color", d => d.color)
        .style("color", d => d.color)
        .html(d => `
            <h2>${d3.format(",")(d.value)}</h2>
            <p>${d.label}</p>
        `);

    // Add tooltip
        widgetContainer.selectAll(".widget")
        .on("mouseenter", function(d) {
            d3.select(this)
                .style("opacity", 0.7); // Reduce opacity on hover
            // Show tooltip with detailed information
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${d.label}</strong><br/>${d3.format(",")(d.value)}`)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseleave", function(d) {
            d3.select(this)
                .style("opacity", 1); // Restore opacity on mouseout
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });
        
}