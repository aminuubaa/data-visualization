const width = 960;
const height = 600;
const bubbleScale = 100000; // Scaling factor for bubble size

const svg = d3.select("svg.map");

d3.json("https://d3js.org/world-110m.v1.json").then(worldData => {
    drawMap(worldData);
    drawBubbles(dummyData);
    drawLegend();
});

const projection = d3.geoMercator()
    .scale(150)
    .translate([width / 2, height / 1.5]);

const path = d3.geoPath().projection(projection);

// Dummy data
const dummyData = [
    { name: "Paris", coordinates: [2.3522, 48.8566], value: 1000000 },
    { name: "London", coordinates: [-0.1276, 51.5074], value: 2000000 },
    { name: "Rome", coordinates: [12.4964, 41.9028], value: 1500000 },
    { name: "Tokyo", coordinates: [139.6917, 35.6895], value: 3000000 },
    { name: "New York", coordinates: [-74.0060, 40.7128], value: 2500000 }
];

function drawMap(worldData) {
    const countries = topojson.feature(worldData, worldData.objects.countries).features;

    svg.selectAll("path")
        .data(countries)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "country")
        .on("click", function (event, d) {
            d3.selectAll(".country").classed("selected", false);
            d3.select(this).classed("selected", true);
        });
}

function drawBubbles(data) {
    const bubbles = svg.selectAll("circle")
        .data(data)
        .enter().append("circle")
        .attr("cx", d => projection(d.coordinates)[0])
        .attr("cy", d => projection(d.coordinates)[1])
        .attr("r", d => Math.sqrt(d.value / bubbleScale))
        .attr("class", "bubble")
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill", "#ff0000")
                .attr("r", Math.sqrt(d.value / bubbleScale) * 1.2);
            showTooltip(event, d);
        })
        .on("mouseout", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("fill", "#69b3a2")
                .attr("r", Math.sqrt(d.value / bubbleScale));
            hideTooltip();
        })
        .append("title")
        .text(d => `${d.name}: ${d.value}`);
}

function drawLegend() {
    const legendData = [1000000, 2000000, 3000000];
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", "translate(20, 20)");

    legend.selectAll("circle")
        .data(legendData)
        .enter().append("circle")
        .attr("cx", 20)
        .attr("cy", (d, i) => i * 40)
        .attr("r", d => Math.sqrt(d / bubbleScale))
        .attr("class", "bubble");

    legend.selectAll("text")
        .data(legendData)
        .enter().append("text")
        .attr("x", 40)
        .attr("y", (d, i) => i * 40 + 5)
        .text(d => d);
}

function showTooltip(event, d) {
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "#fff")
        .style("border", "1px solid #000")
        .style("padding", "5px")
        .style("pointer-events", "none")
        .style("z-index", "10")
        .html(`<strong>${d.name}</strong><br>Value: ${d.value}`);
    
    tooltip.style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 20}px`);
}

function hideTooltip() {
    d3.select(".tooltip").remove();
}
