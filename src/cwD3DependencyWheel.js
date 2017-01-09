/* Copyright (c) 2012-2013 Casewise Systems Ltd (UK) - All rights reserved */

(function(cwApi, $) {
	"use strict";
	/*global cwAPI, jQuery */

	var cwLayoutD3DependencyWheel = function(options, viewSchema) {
		cwApi.extend(this, cwApi.cwLayouts.CwLayout, options, viewSchema);
		this.drawOneMethod = cwLayoutD3DependencyWheel.drawOne.bind(this);
		this.hasTooltip = true;
		cwApi.registerLayoutForJSActions(this);

	};

	cwLayoutD3DependencyWheel.drawOne = function(output, item, callback, nameOnly) {

		// var associationSchema, layout, nodeId, associatedObj;
		// // nextNodeId = node.mmNode.SortedChildren[0].NodeId;
		// nodeId = this.mmNode.SortedChildren[0].NodeId;
		// associationSchema = cwApi.ViewSchemaManager.getNode(this.viewSchema, nodeId);
		// layout = new cwApi.cwLayouts[associationSchema.LayoutName](associationSchema.LayoutOptions, this.viewSchema);
		// layout.item = item;
		// if (!cwApi.isUndefined(cwApi.cwLayouts[associationSchema.LayoutDrawOne].drawOne)) {
		// 	layout.drawOneMethod = cwApi.cwLayouts[associationSchema.LayoutDrawOne].drawOne.bind(layout);
		// }
		// return associatedObj = layout.drawAssociations(output, null, item, null);
	};



	cwLayoutD3DependencyWheel.prototype.getPackageNames = function(targetObjectsBySource, urlByName) {
		var packageNames = [],
			target, targetName, layout;
		for (var key in targetObjectsBySource) {
			if (packageNames.indexOf(key) === -1) {
				packageNames.push(key);
			}
			var targetObjects = targetObjectsBySource[key];

			if (targetObjects.data.length !== 0) {
				for (i = 0; i < targetObjects.data.length; i++) {
					target = targetObjects.data[i];
					//targetName = target.name; //this.getDisplayItem(child, true);
					//var packageName = child.properties[sourceDisplayProperty];
					//packageNames.push(targetName);
					layout = targetObjects.layout;

					targetName = layout.displayProperty.getDisplayString(target);
					if (packageNames.indexOf(targetName) === -1) {
						packageNames.push(targetName);
						if (layout.options.HasLink){
							urlByName[targetName] = layout.singleLinkMethod(layout.defaultLinkView, target);
						}
					}
				}
			}
		}
		return packageNames.sort();
	};
	cwLayoutD3DependencyWheel.prototype.getTargetNamesBySourceName = function(targetObjectsBySource) {
		var targetNamesBySourceName = {},
			target, targetName, layout;
		for (var key in targetObjectsBySource) {
			targetNamesBySourceName[key] = [];
			var targetObjects = targetObjectsBySource[key];
			if (targetObjects.data.length !== 0) {

				for (i = 0; i < targetObjects.data.length; i++) {
					target = targetObjects.data[i];
					layout = targetObjects.layout;
					
					targetName = layout.displayProperty.getDisplayString(target);

					//var packageName = child.properties[sourceDisplayProperty];
					targetNamesBySourceName[key].push(targetName);
				}
			}
		}
		return targetNamesBySourceName;
	};

	cwLayoutD3DependencyWheel.setMatrix = function(packageNames, targetNamesBySourceName) {
		var matrix = [];

		for (var i = 0; i < packageNames.length; i++) {
			var rowKey = packageNames[i];
			var row = [];
			for (var j = 0; j < packageNames.length; j++) {
				var columnKey = packageNames[j];
				if (cwApi.isUndefinedOrNull(targetNamesBySourceName[rowKey])) {
					row.push(0);
				} else if (targetNamesBySourceName[rowKey].indexOf(columnKey) > -1) {
					row.push(1);
				} else {
					row.push(0);
				}
			}
			matrix.push(row);
		}
		return matrix;
	};


	cwLayoutD3DependencyWheel.prototype.getTargetObjects = function(output, item, callback, nameOnly) {

		var associationSchema, layout, nodeId, associatedObj;
		// nextNodeId = node.mmNode.SortedChildren[0].NodeId;
		nodeId = this.mmNode.SortedChildren[0].NodeId;
		associationSchema = cwApi.ViewSchemaManager.getNode(this.viewSchema, nodeId);
		layout = new cwApi.cwLayouts[associationSchema.LayoutName](associationSchema.LayoutOptions, this.viewSchema);
		layout.item = item;
		if (!cwApi.isUndefined(cwApi.cwLayouts[associationSchema.LayoutDrawOne].drawOne)) {
			layout.drawOneMethod = cwApi.cwLayouts[associationSchema.LayoutDrawOne].drawOne.bind(layout);
		}
		return associatedObj = layout.drawAssociations2(output, null, item, null);
	};

	cwLayoutD3DependencyWheel.getNextLayoutNodeAndItems = function(node, schema, sources) {
		'use strict';
		var i, j, item, tgt, nextNodeId, associationSchema, nextLayout, targets = [],
			itemsToDisplay = [],
			distinct = {};

		// if (node.mmNode.SortedChildren.length > 1) {
		// 	return;
		// }

		var isTarget = node.mmNode.LayoutOptions.CustomOptions["target"];
		if (node.mmNode.LayoutName === 'cwLayoutD3DependencyWheel' && !isTarget) {
			for (i = 0; i < sources.length; i += 1) {
				item = sources[i];
				targets = targets.concat(item.associations[node.mmNode.NodeID]);
			}
			nextNodeId = node.mmNode.SortedChildren[0].NodeId;
			associationSchema = cwApi.ViewSchemaManager.getNode(schema, nextNodeId);
			nextLayout = new cwApi.cwLayouts[associationSchema.LayoutName](associationSchema.LayoutOptions, schema);
			return cwLayoutD3DependencyWheel.getNextLayoutNodeAndItems(nextLayout, schema, targets);
		}

		// set itemsToDisplay
		for (i = 0; i < sources.length; i += 1) {
			item = sources[i];
			for (j = 0; j < item.associations[node.mmNode.NodeID].length; j += 1) {
				tgt = item.associations[node.mmNode.NodeID][j];
				if (!distinct.hasOwnProperty(tgt.object_id)) {
					distinct[tgt.object_id] = tgt;
					itemsToDisplay.push(tgt);
				}
			}
		}
		return {
			layout: node,
			data: itemsToDisplay
		};
	};

	cwLayoutD3DependencyWheel.prototype.buildWheel = function(packageNames, matrix, itemsByKey, dataByName, selection) {

		var chart = d3.chart.dependencyWheel();
		var data = {
			packageNames: packageNames, //['Business Role', 'Business Activity', 'Entity'],
			matrix: matrix, // B doesn't depend on A or Main
			itemsByKey : itemsByKey,
			dataByName : dataByName
		};

		setTimeout(function() {
			d3.select('.' + selection)
				.datum(data)
				.call(chart);
		}, 500);
	};

	cwLayoutD3DependencyWheel.prototype.drawAssociations = function(output, associationTitleText, object) {

		var that = this;
        var libToLoad = [];

        if(cwAPI.isDebugMode() === true) {
        	this.drawAssociations2(output, associationTitleText, object);
        } else {
            libToLoad = ['modules/d3/d3.concat.js','modules/d3DependenctWheel/d3DependenctWheel.concat.js'];
            // AsyncLoad
            cwApi.customLibs.aSyncLayoutLoader.loadUrls(libToLoad,function(error){
                if(error === null) {
            		that.drawAssociations2(output, associationTitleText, object);
                } else {
                    cwAPI.Log.Error(error);
                }
            });
        }
    };


	cwLayoutD3DependencyWheel.prototype.drawAssociations2 = function(output, associationTitleText, object) {
		'use strict';
		var i, s, child, associationTargetNode, objectId, sortedItems;

		var packageNames = [],
			targetObjectsBySource = {},
			targetNamesBySourceName = {},
			urlByName = {},
			matrix = [],
			isJumpLevel, isTargetLevel, isSourceLevel;

		isJumpLevel = this.options.CustomOptions['jump'];
		isTargetLevel = this.options.CustomOptions['target'];
		isSourceLevel = this.options.CustomOptions['source'];

		if (cwApi.isUndefinedOrNull(object) || cwApi.isUndefined(object.associations)) {
			// Is a creation page therefore a real object does not exist
			if (!cwApi.isUndefined(this.mmNode.AssociationsTargetObjectTypes[this.nodeID])) {
				objectId = 0;
				associationTargetNode = this.mmNode.AssociationsTargetObjectTypes[this.nodeID];
			} else {
				return;
			}
		} else {
			if (!cwApi.isUndefined(object.associations[this.nodeID])) {
				objectId = object.object_id;
				associationTargetNode = object.associations[this.nodeID];
			} else {
				return;
			}
		}
		
		if (isJumpLevel) {
			var targetObjects = cwLayoutD3DependencyWheel.getNextLayoutNodeAndItems(this, this.viewSchema, [object]);
			return targetObjects;
		}
		if (isTargetLevel) {
			return {
				layout: this,
				data: associationTargetNode
			};
		}
		if (isSourceLevel) {
			if (associationTargetNode.length !== 0) {
				'use strict';
				
				var selection = this.nodeID + "-" + object.object_id;
				output.push('<div class="', selection, ' cw-visible"></div>');

				//	console.log(this.nodeID);

				for (i = 0; i < associationTargetNode.length; i++) {

					child = associationTargetNode[i];
					var targetObjects = this.getTargetObjects(output, child);
					var key = this.displayProperty.getDisplayString(child);
					if (this.options.HasLink){
							urlByName[key] = this.singleLinkMethod(this.defaultLinkView, child);
					}

					if (!(key in targetObjectsBySource)) {
						targetObjectsBySource[key] = targetObjects;
					}
				}

				targetNamesBySourceName = this.getTargetNamesBySourceName(targetObjectsBySource);
				packageNames = this.getPackageNames(targetObjectsBySource, urlByName);
				matrix = cwLayoutD3DependencyWheel.setMatrix(packageNames, targetNamesBySourceName);

				this.buildWheel(packageNames, matrix, targetNamesBySourceName, urlByName, selection);
			} else {
				output.push('<div class="', this.nodeID, '">Sorry, no content</div>');
			}
		}
	};
	cwApi.cwLayouts.cwLayoutD3DependencyWheel = cwLayoutD3DependencyWheel;
}(cwAPI, jQuery));