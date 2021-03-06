import React from "react";
// @ts-ignore
import * as d3 from "d3";
import data from "../data.json";

const SIZE = 975;
const RADIUS = SIZE / 2;

const SunburstChart = () => {
  const svgRef = React.useRef<SVGSVGElement>(null);

  const partition = (data: any) =>
    d3.partition().size([2 * Math.PI, RADIUS])(
      d3
        .hierarchy(data)
        .sum((d: any) => d.value)
        .sort((a: any, b: any) => b.value - a.value)
    );

  const color = d3.scaleOrdinal(
    d3.quantize(d3.interpolateRainbow, data.children.length + 1)
  );

  const format = d3.format(",d");

  const arc: any = d3
    .arc()
    .startAngle((d: any) => d.x0)
    .endAngle((d: any) => d.x1)
    .padAngle((d: any) => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(RADIUS / 2)
    .innerRadius((d: any) => d.y0)
    .outerRadius((d: any) => d.y1 - 1);
    
  const getAutoBox = () => {
    if (!svgRef.current) {
      return "";
    }
    const { x, y, width, height } = svgRef.current.getBBox();
    return [x, y, width, height].toString();
  };

  React.useEffect(() => {
    const root = partition(data);

    const svg = d3.select(svgRef.current);

    const tooldiv = d3
      .select("#chartArea")
      .append("div")
      .style("visibility", "hidden")
      // .style("position", "absolute")
      .style("background-color", "white")
      .style("padding", "0.5em 1.5em")
      .style("min-width", "250px")
      .style("max-width", "250px")
      .style("border", "1px solid #e8e8e8")
      .style("font-family", "Helvetica")
      .style("position", "fixed");
    
    const mobileVersion = () => tooldiv.style("top", "5%").style("left", "");
    const desktopVersion = () => tooldiv.style("top", "3%").style("left", "77%");

    window.addEventListener('load', function() {
      if (window.innerWidth < 600) {
        mobileVersion();
      } 
      if (window.innerWidth > 600) {
        desktopVersion();
      } 
    });

    window.addEventListener("resize", function(){
      if (window.innerWidth > 500) {
        desktopVersion();
      } else {
        mobileVersion();
      }
    });

    svg
      .append("g")
      .attr("fill-opacity", 0.9)
      .selectAll("path")
      .data(root.descendants().filter((d: any) => d.depth))
      .join("path")
      .attr("fill", (d: any) => {
        while (d.depth > 1) d = d.parent;
        return color(d.data.name);
      })
      .attr("d", arc)
      .on("click", (e: any, d: any) => {
        tooldiv
          .style("visibility", "visible")
          // .text(`${d.data.name}: ${d.data.description}`)
          .html(`<p><strong>${d.data.name}</strong></p><hr/><p>${d.data.description}</p>`)
      })
      .append("title")
      .text(
        (d: any) =>
          `${d
            .ancestors()
            .map((d: any) => d.data.name)
            .reverse()
            .join("/")}\n${format(d.value)}`
      );

    svg
      .append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .attr("font-size", 10)
      .attr("font-family", "sans-serif")
      .selectAll("text")
      .data(
        root
          .descendants()
          .filter(
            (d: any) => d.depth && ((d.y0 + d.y1) / 2) * (d.x1 - d.x0) > 10
          )
      )
      .join("text")
      .attr("transform", function (d: any) {
        const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        return `rotate(${
          x - 90
        }) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
      })
      .attr("dy", "0.35em")
      .text((d: any) => d.data.name);

    svg.attr("viewBox", getAutoBox);
  }, [arc, color, format]);

  return (
    <div id="chartArea" style={{'display': 'flex', 'justifyContent': 'center', 'padding': '5% 2%'}}>
      <svg width={SIZE} height={SIZE} ref={svgRef} />
    </div>
  );
};

export default SunburstChart;