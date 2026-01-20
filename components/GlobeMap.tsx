
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { WordEvolution, MigrationPoint } from '../types';
import { COLORS, WORLD_JSON_URL } from '../constants';

interface GlobeMapProps {
  data: WordEvolution | null;
  activeYear: number;
}

const GlobeMap: React.FC<GlobeMapProps> = ({ data, activeYear }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    // Map Projection
    const projection = d3.geoMercator()
      .scale(width / 6.5)
      .translate([width / 2, height / 1.6]);

    const path = d3.geoPath().projection(projection);

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Load World Data
    d3.json(WORLD_JSON_URL).then((worldData: any) => {
      const countries = topojson.feature(worldData, worldData.objects.countries) as any;

      // Draw Countries with the requested color 7448C8
      g.selectAll('.country')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', '#7448C8')
        .attr('fill-opacity', 0.15)
        .attr('stroke', '#7448C8')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 0.8);

      if (data && data.timeline.length > 0) {
        renderMigration(g, projection, data.timeline);
      }
    });

    const renderMigration = (container: d3.Selection<SVGGElement, unknown, null, undefined>, proj: d3.GeoProjection, points: MigrationPoint[]) => {
      // Sort points by year
      const sortedPoints = [...points].sort((a, b) => a.year - b.year);
      
      // Filter points up to active year
      const visiblePoints = sortedPoints.filter(p => p.year <= activeYear);

      // Create lines between points
      const lineData: [number, number][][] = [];
      for (let i = 0; i < visiblePoints.length - 1; i++) {
        const start = proj([visiblePoints[i].longitude, visiblePoints[i].latitude]) as [number, number];
        const end = proj([visiblePoints[i + 1].longitude, visiblePoints[i + 1].latitude]) as [number, number];
        lineData.push([start, end]);
      }

      // Draw Paths
      const lineGenerator = d3.line<[number, number]>().curve(d3.curveBundle.beta(0.5));

      container.selectAll('.migration-path')
        .data(lineData)
        .enter()
        .append('path')
        .attr('class', 'migration-path path-animate')
        .attr('d', d => lineGenerator(d))
        .attr('stroke', COLORS.PRIMARY)
        .attr('stroke-width', 2.5)
        .attr('opacity', 0.8);

      // Draw Points
      const nodes = container.selectAll('.point')
        .data(visiblePoints)
        .enter()
        .append('g')
        .attr('class', 'point')
        .attr('transform', d => {
          const coords = proj([d.longitude, d.latitude]);
          return `translate(${coords?.[0] || 0}, ${coords?.[1] || 0})`;
        });

      nodes.append('circle')
        .attr('r', 6)
        .attr('fill', d => d.year === activeYear ? COLORS.NODE : COLORS.PRIMARY)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .attr('filter', 'url(#glow)');

      // Glow effect
      const defs = svg.append('defs');
      const filter = defs.append('filter').attr('id', 'glow');
      filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'blur');
      filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

      // Labels for visible points
      nodes.append('text')
        .attr('y', -15)
        .attr('text-anchor', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', '700')
        .attr('paint-order', 'stroke')
        .attr('stroke', '#000')
        .attr('stroke-width', '3px')
        .attr('stroke-linecap', 'round')
        .attr('stroke-linejoin', 'round')
        .text(d => `${d.word}`);
    };

  }, [data, activeYear]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent">
      <svg ref={svgRef} className="w-full h-full cursor-move" />
    </div>
  );
};

export default GlobeMap;
