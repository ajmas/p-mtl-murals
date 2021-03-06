(function() {

  const geojsonFiles = [{name: 'neighbourhoods', path: './data/quartierssociologiques2014.geojson', geojson: ""},
                        {name: 'adminRegions', path: './data/limadmin.geojson', geojson: ""},
                        {name: 'subways', path: './data/stm.geojson', geojson: ""},
                        {name: 'murals', path: './data/murals.geojson', geojson: ""}]

  loadGeojsonFilesAndRunMain()

  function loadGeojsonFilesAndRunMain () {
    let q = d3.queue()
    for (let file of geojsonFiles){
      q.defer(d3.json, file.path)
    }
    q.awaitAll((err, files) => {
      if (err) {
        throw err
      } else {
        loadGeojsonFiles(files)
        main()
      }
    })
  }

  function loadGeojsonFiles(files) {
    geojsonFiles.map((file, i) => file.geojson = files[i])
    console.log(geojsonFiles[3].geojson.features)
  }

  function main () {

    const svgWidth = 960
    const svgHeight = 600

    const subwayColorScale = d3.scaleOrdinal()
        .domain(['bleue', 'jaune', 'orange', 'verte'])
        .range(['blue', 'yellow', 'orange', 'green'])

    const muralColorScale = d3.scaleOrdinal()
        .domain([1, 174])
        .range(d3.schemeCategory20)

    const tooltip = d3.select('body')
        .append('div')
        .classed('tooltip', true)

    const mask = d3.select('body')
        .append('div')
        .classed('mask', true)
        .on('click tap', handleBackButton)

    const popup = d3.select('.container')
        .append('div')
        .classed('popup', true)

    const svg = d3.select('svg')
      .attr('width', svgWidth)
      .attr('height', svgHeight)
      .call(responsivefy)
      .append('g')

    const g = svg.append('g')

    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on("zoom", zoomed)

    svg
      .call(zoom)

    function zoomed(){
      g.attr("transform", d3.event.transform)

      g
        .selectAll('.mural')
        .attr('r', 8 / (d3.event.transform.k) + 'px')

      }

    const projection = d3.geoMercator()
        .rotate([0, -30, 0]).fitSize([svgWidth, svgHeight], geojsonFiles[0].geojson)

    const path = d3.geoPath()
        .projection(projection)

    function responsivefy(svg) {
      let container = d3.select(svg.node().parentNode),
        width = parseInt(svg.style("width")),
        height = parseInt(svg.style("height")),
        aspect = width / height;

      svg.attr("viewBox", "0 0 " + width + " " + height)
        .attr("perserveAspectRatio", "xMinYMid")
        .call(resize);

      d3.select(window).on("resize." + container.attr("id"), resize);

      function resize() {
        let targetWidth = parseInt(container.style("width"));
        svg.attr("width", targetWidth);
        svg.attr("height", Math.round(targetWidth / aspect));
      }
    }

    g
      .selectAll('.adminRegion')
      .data(geojsonFiles[1].geojson.features)
      .enter()
      .append('path')
      .attr('d', path)
      .classed('adminRegion', true)

    g
      .selectAll('.neighbourhood')
      .data(geojsonFiles[0].geojson.features)
      .enter()
      .append('path')
      .attr('d', path)
      .classed('neighbourhood', true)

    g
      .selectAll('.subway')
      .data(geojsonFiles[2].geojson.features)
      .enter()
      .append('path')
      .attr('d', path)
      .style('stroke', d => subwayColorScale(d.properties.route_name))
      .classed('subway', true)

    g
      .selectAll('.mural')
      .data(geojsonFiles[3].geojson.features)
      .enter()
      .append('circle')
      .attr('cx', d => projection(d.geometry.coordinates)[0])
      .attr('cy', d => projection(d.geometry.coordinates)[1])
      .attr('r', '8px')
      .attr('fill', 'black')
      .style('fill', d => muralColorScale(d.properties.id))
      .classed('mural', true)
      .on('mouseover', handleMouseOverMural)
      .on('mousemove ', handleMouseMoveMural)
      .on('mouseout', handleMouseOutMural)
      .on('mousedown', handleMouseClickMural)

    function handleMouseOverMural(){
      d3.select(this)
        .moveToFront()
        .classed('active', true)
    }

    //create a method used to bring the active svg to front
    d3.selection.prototype.moveToFront = function() {
      return this.each(function(){
        this.parentNode.appendChild(this);
      });
    };

    function handleMouseMoveMural (d) {
      tooltip
        .classed('active', true)
        .style('left', d3.event.x - (tooltip.node().offsetWidth /2 ) + 'px')
        .style('top', d3.event.y - (tooltip.node().offsetHeight + 10) + 'px')
        .html(`<img id='thumbnail' style='width: 200px; height: auto'  src=${d.properties.image}>`)
    }

    function handleMouseOutMural () {
      d3.select(this)
        .classed('active', false)
      tooltip
        .classed('active', false)
    }

    function handleMouseClickMural (d) {
      mask
        .classed('active', true)

      popup
        .classed('active', true)
        .html(
          `<a id='back' class="btn btn-primary">BACK TO MAP</a>
           <img src=${d.properties.image}>
              <div>
                <h4 style='margin-top:5px'>Created by: ${d.properties.artiste} in ${d.properties.annee}</h4>
                <h4>Located at: ${d.properties.adresse}</h4>
              </div>
            </div>`
        )

      d3.select('#back')
        .on('click tap', handleBackButton)

    }

    function handleBackButton () {
      popup
        .classed('active', false)

      mask
        .classed('active', false)
    }

    console.log(mask)
  }
})()
