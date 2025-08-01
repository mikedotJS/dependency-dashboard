const path = require('path');

class HTMLGenerator {
  static generateHTML(data) {
    // Prepare graph data
    const graphData = this.prepareGraphData(data);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dependency Dashboard - ${data.targetFile}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #2c3e50, #3498db);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        .graph-section {
            padding: 30px;
            background: #f8f9fa;
        }
        .graph-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
            text-align: center;
        }
        .graph-container {
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 20px;
            height: 600px;
            position: relative;
        }
        .dependencies {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            padding: 30px;
        }
        .dep-section {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
        }
        .dep-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .dep-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .dep-item {
            background: white;
            margin: 8px 0;
            padding: 12px 16px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .empty-state {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 20px;
        }
        .incoming .dep-item {
            border-left-color: #e67e22;
        }
        .outgoing .dep-item {
            border-left-color: #27ae60;
        }
        .node {
            cursor: pointer;
        }
        .node:hover {
            stroke: #333;
            stroke-width: 2px;
        }
        .link {
            stroke-opacity: 0.7;
        }
        .link:hover {
            stroke-opacity: 1;
            stroke-width: 4px;
        }
        .node-label {
            font-size: 12px;
            font-family: 'Courier New', monospace;
            pointer-events: none;
        }
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 6px;
            font-size: 12px;
            font-family: 'Courier New', monospace;
            pointer-events: none;
            z-index: 1000;
            max-width: 300px;
            white-space: pre-wrap;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        .search-section {
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .search-container {
            max-width: 600px;
            margin: 0 auto;
        }
        .search-input {
            width: 100%;
            padding: 12px 20px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 25px;
            outline: none;
            transition: border-color 0.3s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .search-input:focus {
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        .search-input::placeholder {
            color: #999;
        }
        .search-stats {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        .node.hidden {
            opacity: 0.2;
        }
        .link.hidden {
            opacity: 0.1;
        }
        .dep-item.hidden {
            display: none;
        }
        .highlight {
            background-color: #fff3cd;
            border-left-color: #ffc107 !important;
        }
        .legend {
            display: flex;
            justify-content: center;
            gap: 30px;
            padding: 15px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: #2c3e50;
        }
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .legend-color.target {
            background-color: #e74c3c;
        }
        .legend-color.incoming {
            background-color: #e67e22;
        }
        .legend-color.outgoing {
            background-color: #27ae60;
        }
        .warning {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
        }
        .success {
            background: linear-gradient(45deg, #2ecc71, #27ae60);
            color: white;
        }
        .circular-dependencies-section {
            padding: 30px;
            background: #f8f9fa;
        }
        .circular-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
            text-align: center;
        }
        .circular-item {
            background: white;
            margin: 12px 0;
            padding: 16px 20px;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .circular-item.critical {
            border-left-color: #e74c3c;
            background: linear-gradient(135deg, #fff5f5, #ffe6e6);
        }
        .circular-item.warning {
            border-left-color: #f39c12;
            background: linear-gradient(135deg, #fffbf0, #fff3cd);
        }
        .circular-item.info {
            border-left-color: #3498db;
            background: linear-gradient(135deg, #f0f8ff, #e3f2fd);
        }
        .circular-severity {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8em;
            margin-bottom: 8px;
        }
        .circular-severity.critical {
            color: #e74c3c;
        }
        .circular-severity.warning {
            color: #f39c12;
        }
        .circular-severity.info {
            color: #3498db;
        }
        .circular-cycle {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #2c3e50;
            margin-top: 8px;
            padding: 8px;
            background: rgba(0,0,0,0.05);
            border-radius: 4px;
        }
        @media (max-width: 768px) {
            .dependencies {
                grid-template-columns: 1fr;
            }
            .graph-container {
                height: 400px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Dependency Dashboard</h1>
            <p>File: <strong>${data.targetFile}</strong></p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${Object.keys(data.incoming).length}</div>
                <div class="stat-label">Incoming Dependencies</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(data.outgoing).length}</div>
                <div class="stat-label">Outgoing Dependencies</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.totalFiles}</div>
                <div class="stat-label">Total Files Scanned</div>
            </div>
            ${data.circularDependencies ? `
            <div class="stat-card ${data.circularDependencies.totalCircularDependencies > 0 ? 'warning' : 'success'}">
                <div class="stat-number">${data.circularDependencies.totalCircularDependencies}</div>
                <div class="stat-label">Circular Dependencies</div>
            </div>
            ` : ''}
        </div>
        
        <div class="search-section">
            <div class="search-container">
                <input type="text" id="searchInput" class="search-input" placeholder="Search dependencies, imports, or file names..." />
                <div class="search-stats" id="searchStats"></div>
            </div>
        </div>
        
        <div class="legend">
            <div class="legend-item">
                <div class="legend-color target"></div>
                <span>Target File</span>
            </div>
            <div class="legend-item">
                <div class="legend-color incoming"></div>
                <span>Incoming Dependencies</span>
            </div>
            <div class="legend-item">
                <div class="legend-color outgoing"></div>
                <span>Outgoing Dependencies</span>
            </div>
        </div>
        
        <div class="graph-section">
            <div class="graph-title">🔗 Dependency Graph</div>
            <div class="graph-container">
                <svg id="graph" width="100%" height="100%"></svg>
                <div id="tooltip" class="tooltip" style="display: none;"></div>
            </div>
        </div>
        
        ${data.circularDependencies && data.circularDependencies.totalCircularDependencies > 0 ? `
        <div class="circular-dependencies-section">
            <div class="circular-title">⚠️ Circular Dependencies Detected</div>
            ${data.circularDependencies.circularDependencies.map(cd => `
                <div class="circular-item ${cd.severity}">
                    <div class="circular-severity ${cd.severity}">${cd.severity.toUpperCase()}</div>
                    <div>${cd.description}</div>
                    <div class="circular-cycle">${cd.cycle.join(' → ')}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="dependencies">
            <div class="dep-section incoming">
                <div class="dep-title">🔽 Incoming Dependencies</div>
                ${Object.keys(data.incoming).length > 0 ? 
                    `<ul class="dep-list" id="incomingList">
                        ${Object.entries(data.incoming).map(([dep, details]) => 
                            `<li class="dep-item" data-search="${dep.toLowerCase()} ${details.join(' ').toLowerCase()}">${dep}<br><small>${details.join(', ')}</small></li>`
                        ).join('')}
                    </ul>` : 
                    '<div class="empty-state">No incoming dependencies found</div>'
                }
            </div>
            
            <div class="dep-section outgoing">
                <div class="dep-title">🔼 Outgoing Dependencies</div>
                ${Object.keys(data.outgoing).length > 0 ? 
                    `<ul class="dep-list" id="outgoingList">
                        ${Object.entries(data.outgoing).map(([dep, details]) => 
                            `<li class="dep-item" data-search="${dep.toLowerCase()} ${details.join(' ').toLowerCase()}">${dep}<br><small>${details.join(', ')}</small></li>`
                        ).join('')}
                    </ul>` : 
                    '<div class="empty-state">No outgoing dependencies found</div>'
                }
            </div>
        </div>
    </div>
    
    <script>
        // Graph data
        const graphData = ${JSON.stringify(graphData)};
        
        // Set up the graph
        const width = document.querySelector('.graph-container').clientWidth - 40;
        const height = document.querySelector('.graph-container').clientHeight - 40;
        
        const svg = d3.select("#graph")
            .attr("width", width)
            .attr("height", height);
        
        // Create force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force("link", d3.forceLink(graphData.links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(30));
        
        // Create links
        const link = svg.append("g")
            .selectAll("line")
            .data(graphData.links)
            .enter().append("line")
            .attr("class", "link")
            .attr("stroke", d => {
                // Color links based on direction
                const targetNode = graphData.nodes.find(n => n.isTarget);
                if (d.target.id === targetNode.id) {
                    return "#e67e22"; // Incoming - orange
                } else {
                    return "#27ae60"; // Outgoing - green
                }
            })
            .attr("stroke-width", 3);
        
        // Create nodes
        const node = svg.append("g")
            .selectAll("circle")
            .data(graphData.nodes)
            .enter().append("circle")
            .attr("class", "node")
            .attr("r", d => d.isTarget ? 12 : 8)
            .attr("fill", d => {
                if (d.isTarget) return "#e74c3c"; // Target file - red
                // Check if this node has incoming dependencies to target
                const hasIncoming = graphData.links.some(link => 
                    link.target.id === d.id && link.source.id === graphData.nodes.find(n => n.isTarget).id
                );
                if (hasIncoming) return "#e67e22"; // Incoming - orange
                return "#27ae60"; // Outgoing - green
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        
        // Add labels
        const label = svg.append("g")
            .selectAll("text")
            .data(graphData.nodes)
            .enter().append("text")
            .attr("class", "node-label")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text(d => d.id.length > 20 ? d.id.substring(0, 20) + "..." : d.id)
            .attr("fill", "#333");
        
        // Update positions on tick
        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);
            
            node
                .attr("cx", d => d.x)
                .attr("cy", d => d.y);
            
            label
                .attr("x", d => d.x)
                .attr("y", d => d.y);
        });
        
        // Add tooltip functionality
        const tooltip = d3.select("#tooltip");
        
        node.on("mouseover", function(event, d) {
            if (d.importDetails && Array.isArray(d.importDetails) && d.importDetails.length > 0) {
                const details = d.importDetails.join('\\n');
                tooltip
                    .style("display", "block")
                    .html(\`<strong>\${d.id}</strong><br>\${details}\`);
            } else if (d.isTarget) {
                tooltip
                    .style("display", "block")
                    .html(\`<strong>\${d.id}</strong><br>Target file\`);
            }
            
            // Position tooltip next to the node
            const tooltipNode = tooltip.node();
            const tooltipRect = tooltipNode.getBoundingClientRect();
            const graphContainer = document.querySelector('.graph-container');
            const containerRect = graphContainer.getBoundingClientRect();
            
            // Get node position
            const nodeX = d.x;
            const nodeY = d.y;
            
            // Calculate tooltip position (to the right of the node)
            let tooltipX = nodeX + 20;
            let tooltipY = nodeY - tooltipRect.height / 2;
            
            // Adjust if tooltip would go outside the container
            if (tooltipX + tooltipRect.width > containerRect.width - 20) {
                tooltipX = nodeX - tooltipRect.width - 20; // Position to the left
            }
            if (tooltipY < 20) {
                tooltipY = 20; // Don't go above container
            }
            if (tooltipY + tooltipRect.height > containerRect.height - 20) {
                tooltipY = containerRect.height - tooltipRect.height - 20; // Don't go below container
            }
            
            tooltip
                .style("left", tooltipX + "px")
                .style("top", tooltipY + "px");
        })
        .on("mouseout", function() {
            tooltip.style("display", "none");
        });
        
        // Add drag behavior
        node.call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
        
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }
        
        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }
        
        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }
        
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchStats = document.getElementById('searchStats');
        
        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            let matchCount = 0;
            
            if (searchTerm === '') {
                // Reset all visibility
                node.classed('hidden', false);
                link.classed('hidden', false);
                d3.selectAll('.dep-item').classed('hidden', false).classed('highlight', false);
                searchStats.textContent = '';
                return;
            }
            
            // Search through graph nodes
            node.each(function(d) {
                const nodeElement = d3.select(this);
                const nodeText = d.id.toLowerCase();
                const importDetails = d.importDetails ? d.importDetails.join(' ').toLowerCase() : '';
                const searchText = nodeText + ' ' + importDetails;
                
                if (searchText.includes(searchTerm)) {
                    nodeElement.classed('hidden', false);
                    matchCount++;
                } else {
                    nodeElement.classed('hidden', true);
                }
            });
            
            // Hide/show links based on visible nodes
            link.each(function(d) {
                const linkElement = d3.select(this);
                const sourceVisible = !d.source.hidden;
                const targetVisible = !d.target.hidden;
                
                if (sourceVisible && targetVisible) {
                    linkElement.classed('hidden', false);
                } else {
                    linkElement.classed('hidden', true);
                }
            });
            
            // Search through dependency lists
            d3.selectAll('.dep-item').each(function() {
                const item = d3.select(this);
                const searchData = item.attr('data-search');
                
                if (searchData && searchData.includes(searchTerm)) {
                    item.classed('hidden', false).classed('highlight', true);
                    matchCount++;
                } else {
                    item.classed('hidden', true).classed('highlight', false);
                }
            });
            
            // Update search stats
            if (searchTerm) {
                searchStats.textContent = \`Found \${matchCount} matches for "\${searchTerm}"\`;
            } else {
                searchStats.textContent = '';
            }
        }
        
        // Add event listeners
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchInput.value = '';
                performSearch();
                searchInput.blur();
            }
        });
    </script>
</body>
</html>`;
  }

  static generateFolderHTML(data) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Folder Dependency Dashboard</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(45deg, #2c3e50, #3498db);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 30px;
            background: #f8f9fa;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        .metrics-section {
            padding: 30px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            margin-top: 20px;
        }
        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
        }
        .metric-title {
            font-size: 1.3em;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 8px;
        }
        .file-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .file-item {
            background: white;
            margin: 8px 0;
            padding: 12px 16px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        .file-name {
            font-weight: bold;
            color: #2c3e50;
        }
        .file-stats {
            color: #7f8c8d;
            font-size: 0.8em;
            margin-top: 4px;
        }
        .most-depended-on .file-item {
            border-left-color: #e67e22;
        }
        .most-dependent .file-item {
            border-left-color: #27ae60;
        }
        .highest-ratio .file-item {
            border-left-color: #9b59b6;
        }
        .warning {
            background: linear-gradient(45deg, #ff6b6b, #ee5a24);
            color: white;
        }
        .success {
            background: linear-gradient(45deg, #2ecc71, #27ae60);
            color: white;
        }
        .circular-dependencies-section {
            padding: 30px;
            background: #f8f9fa;
        }
        .circular-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
            text-align: center;
        }
        .circular-item {
            background: white;
            margin: 12px 0;
            padding: 16px 20px;
            border-radius: 8px;
            border-left: 4px solid #e74c3c;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .circular-item.critical {
            border-left-color: #e74c3c;
            background: linear-gradient(135deg, #fff5f5, #ffe6e6);
        }
        .circular-item.warning {
            border-left-color: #f39c12;
            background: linear-gradient(135deg, #fffbf0, #fff3cd);
        }
        .circular-item.info {
            border-left-color: #3498db;
            background: linear-gradient(135deg, #f0f8ff, #e3f2fd);
        }
        .circular-severity {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.8em;
            margin-bottom: 8px;
        }
        .circular-severity.critical {
            color: #e74c3c;
        }
        .circular-severity.warning {
            color: #f39c12;
        }
        .circular-severity.info {
            color: #3498db;
        }
        .circular-cycle {
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            color: #2c3e50;
            margin-top: 8px;
            padding: 8px;
            background: rgba(0,0,0,0.05);
            border-radius: 4px;
        }
        .search-section {
            padding: 20px 30px;
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        .search-container {
            max-width: 600px;
            margin: 0 auto;
        }
        .search-input {
            width: 100%;
            padding: 12px 20px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 25px;
            outline: none;
            transition: border-color 0.3s ease;
        }
        .search-input:focus {
            border-color: #3498db;
            box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
        }
        .search-stats {
            margin-top: 10px;
            font-size: 14px;
            color: #666;
            text-align: center;
        }
        .file-item.hidden {
            display: none;
        }
        .highlight {
            background-color: #fff3cd;
            border-left-color: #ffc107 !important;
        }
        .all-files-section {
            padding: 30px;
            background: #f8f9fa;
        }
        .all-files-title {
            font-size: 1.5em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
            text-align: center;
        }
        .files-table {
            width: 100%;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .files-table th,
        .files-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }
        .files-table th {
            background: #2c3e50;
            color: white;
            font-weight: bold;
        }
        .files-table tr:hover {
            background: #f8f9fa;
        }
        .sortable {
            cursor: pointer;
        }
        .sortable:hover {
            background: #34495e;
        }
        @media (max-width: 768px) {
            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Folder Dependency Dashboard</h1>
            <p>Analysis of <strong>${data.totalFiles}</strong> files</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${data.totalFiles}</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.summary.totalDependencies}</div>
                <div class="stat-label">Total Dependencies</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.summary.averageIncoming.toFixed(1)}</div>
                <div class="stat-label">Avg Incoming</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.summary.averageOutgoing.toFixed(1)}</div>
                <div class="stat-label">Avg Outgoing</div>
            </div>
            ${data.circularDependencies ? `
            <div class="stat-card ${data.circularDependencies.totalCircularDependencies > 0 ? 'warning' : 'success'}">
                <div class="stat-number">${data.circularDependencies.totalCircularDependencies}</div>
                <div class="stat-label">Circular Dependencies</div>
            </div>
            ` : ''}
        </div>
        
        <div class="search-section">
            <div class="search-container">
                <input type="text" id="searchInput" class="search-input" placeholder="Search files..." />
                <div class="search-stats" id="searchStats"></div>
            </div>
        </div>
        
        <div class="metrics-section">
            <div class="metrics-grid">
                <div class="metric-card most-depended-on">
                    <div class="metric-title">🔽 Most Depended On</div>
                    <ul class="file-list">
                        ${data.metrics.mostDependedOn.map(file => 
                            `<li class="file-item" data-search="${file.file.toLowerCase()}">
                                <div class="file-name">${file.file}</div>
                                <div class="file-stats">Incoming: ${file.incomingCount} | Outgoing: ${file.outgoingCount}</div>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="metric-card most-dependent">
                    <div class="metric-title">🔼 Most Dependent</div>
                    <ul class="file-list">
                        ${data.metrics.mostDependent.map(file => 
                            `<li class="file-item" data-search="${file.file.toLowerCase()}">
                                <div class="file-name">${file.file}</div>
                                <div class="file-stats">Incoming: ${file.incomingCount} | Outgoing: ${file.outgoingCount}</div>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
                
                <div class="metric-card highest-ratio">
                    <div class="metric-title">⚖️ Highest Dependency Ratio</div>
                    <ul class="file-list">
                        ${data.metrics.highestRatio.map(file => 
                            `<li class="file-item" data-search="${file.file.toLowerCase()}">
                                <div class="file-name">${file.file}</div>
                                <div class="file-stats">Ratio: ${file.dependencyRatio.toFixed(2)} | In: ${file.incomingCount} | Out: ${file.outgoingCount}</div>
                            </li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
        </div>
        
        ${data.circularDependencies && data.circularDependencies.totalCircularDependencies > 0 ? `
        <div class="circular-dependencies-section">
            <div class="circular-title">⚠️ Circular Dependencies Detected</div>
            ${data.circularDependencies.circularDependencies.map(cd => `
                <div class="circular-item ${cd.severity}">
                    <div class="circular-severity ${cd.severity}">${cd.severity.toUpperCase()}</div>
                    <div>${cd.description}</div>
                    <div class="circular-cycle">${cd.cycle.join(' → ')}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        <div class="all-files-section">
            <div class="all-files-title">📋 All Files</div>
            <table class="files-table">
                <thead>
                    <tr>
                        <th class="sortable" data-sort="file">File</th>
                        <th class="sortable" data-sort="incomingCount">Incoming</th>
                        <th class="sortable" data-sort="outgoingCount">Outgoing</th>
                        <th class="sortable" data-sort="totalDependencies">Total</th>
                        <th class="sortable" data-sort="dependencyRatio">Ratio</th>
                    </tr>
                </thead>
                <tbody id="filesTableBody">
                    ${data.files.map(file => 
                        `<tr class="file-row" data-search="${file.file.toLowerCase()}">
                            <td class="file-name">${file.file}</td>
                            <td>${file.incomingCount}</td>
                            <td>${file.outgoingCount}</td>
                            <td>${file.totalDependencies}</td>
                            <td>${file.dependencyRatio.toFixed(2)}</td>
                        </tr>`
                    ).join('')}
                </tbody>
            </table>
        </div>
    </div>
    
    <script>
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchStats = document.getElementById('searchStats');
        
        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            let matchCount = 0;
            
            if (searchTerm === '') {
                document.querySelectorAll('.file-item, .file-row').forEach(el => {
                    el.classList.remove('hidden', 'highlight');
                });
                searchStats.textContent = '';
                return;
            }
            
            document.querySelectorAll('.file-item, .file-row').forEach(el => {
                const searchData = el.getAttribute('data-search');
                
                if (searchData && searchData.includes(searchTerm)) {
                    el.classList.remove('hidden').classList.add('highlight');
                    matchCount++;
                } else {
                    el.classList.add('hidden').classList.remove('highlight');
                }
            });
            
            if (searchTerm) {
                searchStats.textContent = \`Found \${matchCount} matches for "\${searchTerm}"\`;
            } else {
                searchStats.textContent = '';
            }
        }
        
        // Sorting functionality
        document.querySelectorAll('.sortable').forEach(th => {
            th.addEventListener('click', function() {
                const sortBy = this.getAttribute('data-sort');
                const tbody = document.getElementById('filesTableBody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                rows.sort((a, b) => {
                    const aVal = a.querySelector(\`td:nth-child(\${getColumnIndex(sortBy)})\`).textContent;
                    const bVal = b.querySelector(\`td:nth-child(\${getColumnIndex(sortBy)})\`).textContent;
                    
                    if (sortBy === 'file') {
                        return aVal.localeCompare(bVal);
                    } else {
                        return parseFloat(bVal) - parseFloat(aVal);
                    }
                });
                
                rows.forEach(row => tbody.appendChild(row));
            });
        });
        
        function getColumnIndex(sortBy) {
            const columns = ['file', 'incomingCount', 'outgoingCount', 'totalDependencies', 'dependencyRatio'];
            return columns.indexOf(sortBy) + 1;
        }
        
        // Event listeners
        searchInput.addEventListener('input', performSearch);
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                searchInput.value = '';
                performSearch();
                searchInput.blur();
            }
        });
    </script>
</body>
</html>`;
  }

  static prepareGraphData(data) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Add target node
    const targetNode = {
      id: data.targetFile,
      isTarget: true,
      importDetails: null
    };
    nodes.push(targetNode);
    nodeMap.set(data.targetFile, targetNode);
    
    // Add incoming dependency nodes and links
    Object.entries(data.incoming).forEach(([dep, importDetails]) => {
      if (!nodeMap.has(dep)) {
        const node = { 
          id: dep, 
          isTarget: false,
          importDetails: importDetails
        };
        nodes.push(node);
        nodeMap.set(dep, node);
      }
      links.push({
        source: dep,
        target: data.targetFile,
        type: 'incoming'
      });
    });
    
    // Add outgoing dependency nodes and links
    Object.entries(data.outgoing).forEach(([dep, importDetails]) => {
      if (!nodeMap.has(dep)) {
        const node = { 
          id: dep, 
          isTarget: false,
          importDetails: importDetails
        };
        nodes.push(node);
        nodeMap.set(dep, node);
      }
      links.push({
        source: data.targetFile,
        target: dep,
        type: 'outgoing'
      });
    });
    
    return { nodes, links };
  }
}

module.exports = HTMLGenerator; 